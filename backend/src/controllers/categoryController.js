import slugify from "slugify";
import { Category } from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import { uploadImage } from "../utils/cloudinary.js";
// tạo danh mục
export const createCategory = async (req, res) => {
  try {
    const { name, description, parent, isFeatured } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existedCategory = await Category.findOne({ slug });
    if (existedCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    let image = "";

    if (req.file) {
      const result = await uploadImage(req.file.buffer, "categories");
      image = result.secure_url;
    }

    const category = await Category.create({
      name,
      slug,
      description,
      parent: parent || null,
      isFeatured: isFeatured || false,
      createdBy: req.user._id,
      image,
    });

    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// tất cả danh mục
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate("parent", "name slug")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// lấy danh mục theo slug
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate("parent", "name slug");

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Danh mục không tồn tại" });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// thêm danh mục
export const updateCategory = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // update slug nếu đổi tên
    if (req.body.name) {
      const slug = slugify(req.body.name, {
        lower: true,
        strict: true,
      });

      const existedCategory = await Category.findOne({
        slug,
        _id: { $ne: req.params.id },
      });

      if (existedCategory) {
        return res.status(400).json({
          success: false,
          message: "Đã trùng với danh mục có sẵn",
        });
      }

      updateData.slug = slug;
    }

    if (req.file) {
      const result = await uploadImage(req.file.buffer, "categories");
      updateData.image = result.secure_url;
    }

    updateData.updatedBy = req.user._id;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Danh mục không tồn tại",
      });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// xóa danh mục (ko xoa db)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Danh mục không tồn tại",
      });
    }

    // kiểm tra còn product không
    const products = await Product.find({
      category: req.params.id,
      isActive: true,
    });

    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa danh mục vì có sản phẩm",
      });
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Đã xóa danh mục",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// lấy danh mục theo id
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate("parent", "name slug");

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// khôi phục xóa mềm
export const restoreCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Danh mục không tồn tại ",
      });
    }

    if (category.isActive === true) {
      return res.status(400).json({
        success: false,
        message: "Danh mục đang hoạt động",
      });
    }

    category.isActive = true;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Danh mục đã được khôi phục",
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// tìm sp theo danh mục
export const getProductsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12, sort = "newest" } = req.query;

    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") sortOption = { price: 1 };
    if (sort === "price-desc") sortOption = { price: -1 };

    const products = await Product.find({
      category: category._id,
      isActive: true,
    })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort(sortOption);

    const total = await Product.countDocuments({
      category: category._id,
      isActive: true,
    });

    res.json({
      success: true,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// đếm số sp trong category
export const getCategoriesWithCount = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          image: 1,
          isFeatured: 1,
          productCount: { $size: "$products" },
        },
      },
      { $sort: { productCount: -1 } },
    ]);

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// lấy danh mục nổi bật
export const getFeaturedCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
      isFeatured: true,
    }).sort({ createdAt: -1 });

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// category và sp nổi bật
export const getCategoryWithHighlightProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const limit = Number(req.query.limit || 8);

    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const products = await Product.find({
      category: category._id,
      isActive: true,
      isFeatured: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      category: {
        _id: category._id,
        name: category.name,
        slug: category.slug,
      },
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
