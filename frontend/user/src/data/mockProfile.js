export const mockUser = {
  _id: "65abc123456789",
  firstName: "Nguyen",
  lastName: "Minh",
  dateOfBirth: "2003-05-10",
  gender: "male",
  email: "minhnguyen@gmail.com",
  phoneNo: "0987654321",
  address: "12 Nguyễn Huệ",
  city: "Nha Trang",
  zipCode: "650000",
  role: "user",
  isVerified: true,

  wishlist: [],
  viewedProducts: [],
  cartAbandonedItems: [],
  preferences: {
    categories: ["Điện thoại", "Laptop"],
    brands: ["Apple", "Samsung"],
    priceRange: {
      min: 1000000,
      max: 50000000,
    },
  },
  searchHistory: [],
};