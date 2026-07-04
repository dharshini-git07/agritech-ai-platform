import { 
  addDoc, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  setDoc, 
  updateDoc, 
  where, 
  orderBy, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { SellerProfile, Product } from "@/types/marketplace";

// Helper to get current user ID
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.uid;
};

// 1. Become Marketplace Seller / Update Seller Profile
export async function becomeSeller(
  profileData: Omit<SellerProfile, "verificationStatus" | "rating">
): Promise<void> {
  const uid = getCurrentUserId();
  const userDocRef = doc(db, "users", uid);
  
  await updateDoc(userDocRef, {
    isSeller: true,
    sellerProfile: {
      ...profileData,
      verificationStatus: "pending",
      rating: 5.0,
    },
  });
}

export async function updateSellerProfile(
  profileData: Partial<SellerProfile>
): Promise<void> {
  const uid = getCurrentUserId();
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);
  
  if (!docSnap.exists()) {
    throw new Error("User profile not found");
  }
  
  const existingData = docSnap.data();
  const existingProfile = existingData.sellerProfile || {};

  await updateDoc(userDocRef, {
    sellerProfile: {
      ...existingProfile,
      ...profileData,
    },
  });
}

// 2. Get Seller Profile
export async function getSellerProfile(uid: string): Promise<SellerProfile | null> {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.isSeller && data.sellerProfile ? (data.sellerProfile as SellerProfile) : null;
  }
  return null;
}

// 3. Add Product
export async function addProduct(
  productData: Omit<Product, "id" | "sellerId" | "sellerType" | "businessName" | "approvalStatus" | "createdAt">
): Promise<string> {
  const uid = getCurrentUserId();
  
  // Get seller info to pre-populate product document
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) {
    throw new Error("Seller profile not found");
  }
  
  const userData = userDoc.data();
  if (!userData.isSeller || !userData.sellerProfile) {
    throw new Error("User is not registered as a seller");
  }
  
  const sellerProfile = userData.sellerProfile as SellerProfile;

  const docRef = await addDoc(collection(db, "products"), {
    ...productData,
    sellerId: uid,
    sellerType: sellerProfile.sellerType,
    businessName: sellerProfile.businessName,
    approvalStatus: "pending", // Starts as pending for admin approval
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

// 4. Update Product
export async function updateProduct(
  productId: string, 
  updates: Partial<Omit<Product, "id" | "sellerId" | "createdAt">>
): Promise<void> {
  const productDocRef = doc(db, "products", productId);
  await updateDoc(productDocRef, {
    ...updates,
    approvalStatus: "pending", // Re-approval needed on edit
  });
}

// 5. Delete Product
export async function deleteProduct(productId: string): Promise<void> {
  const productDocRef = doc(db, "products", productId);
  await deleteDoc(productDocRef);
}

// 6. Get Products
export async function getProducts(filters?: {
  sellerId?: string;
  category?: string;
  subcategory?: string;
  status?: "pending" | "approved" | "rejected";
  search?: string;
}): Promise<Product[]> {
  const productsRef = collection(db, "products");
  let q = query(productsRef, orderBy("createdAt", "desc"));

  // Apply filters using multiple where conditions if possible, 
  // but keep it simple to avoid Firestore index requirements where possible.
  if (filters?.sellerId) {
    q = query(productsRef, where("sellerId", "==", filters.sellerId), orderBy("createdAt", "desc"));
  } else if (filters?.status) {
    q = query(productsRef, where("approvalStatus", "==", filters.status), orderBy("createdAt", "desc"));
  }

  const snapshot = await getDocs(q);
  let products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Product, "id">),
  }));

  // Client-side filtering for other criteria to avoid Firestore Index creation requirements
  if (filters) {
    if (filters.sellerId && filters.status) {
      products = products.filter(p => p.approvalStatus === filters.status);
    }
    if (filters.category && filters.category !== "All") {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters.subcategory) {
      products = products.filter(p => p.subcategory === filters.subcategory);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(
        p => 
          p.productName.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.businessName.toLowerCase().includes(searchLower)
      );
    }
  }

  return products;
}

// 7. Get All Sellers (Admin only)
export async function getAllSellers(): Promise<{ uid: string; name: string; email: string; sellerProfile: SellerProfile }[]> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("isSeller", "==", true));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      name: data.name,
      email: data.email,
      sellerProfile: data.sellerProfile as SellerProfile,
    };
  });
}

// 8. Admin Seller Approval
export async function approveSellerProfile(uid: string, status: "approved" | "rejected"): Promise<void> {
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);
  if (!docSnap.exists()) {
    throw new Error("User profile not found");
  }
  
  const existingData = docSnap.data();
  const existingProfile = existingData.sellerProfile || {};

  await updateDoc(userDocRef, {
    "sellerProfile.verificationStatus": status
  });
}

// 9. Admin Product Approval
export async function approveProduct(productId: string, status: "approved" | "rejected"): Promise<void> {
  const productDocRef = doc(db, "products", productId);
  await updateDoc(productDocRef, {
    approvalStatus: status
  });
}

// AI RECOMMENDATION FOUNDATION ARCHITECTURE
export async function getAiRecommendedProducts(terraceAnalysisId: string): Promise<Product[]> {
  // FUTURE IMPLEMENTATION: Query Firestore/Gemini based on terrace analysis features (e.g. soil vs hydroponic suitability, shade level)
  // Under the hood, this will extract terrace parameters and perform search match or vector search
  console.log(`[AI Recommendations] Preparing architecture layout for Terrace Analysis ${terraceAnalysisId}`);
  
  // Return placeholder recommended products (first 3 approved products) for now
  const allApproved = await getProducts({ status: "approved" });
  return allApproved.slice(0, 3);
}
