import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { uploadToSupabase, deleteFromSupabase } from "../utils/supabase";
import { prisma } from "../server";
import { Prisma } from "@prisma/client";

//create a product
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      price,
      stock,
    } = req.body;

    const files = req.files as Express.Multer.File[];

    // Validate that files exist
    if (!files || files.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: "Please upload at least one image" 
      });
      return;
    }

    //upload all images to Supabase Storage
    let imageUrls: string[] = [];
    try {
      const uploadPromises = files.map(async (file) => {
        if (!file.buffer) {
          throw new Error(`File buffer is missing for file: ${file.originalname}`);
        }
        
        // Upload to Supabase Storage using file buffer
        const publicUrl = await uploadToSupabase(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        
        return publicUrl;
      });

      imageUrls = await Promise.all(uploadPromises);
    } catch (uploadError) {
      console.error("Supabase upload error:", uploadError);
      res.status(500).json({ 
        success: false, 
        message: "Failed to upload images to Supabase. Please check your Supabase configuration." 
      });
      return;
    }

    const newlyCreatedProduct = await prisma.product.create({
      data: {
        name,
        brand,
        category,
        description,
        gender,
        sizes: sizes.split(","),
        colors: colors.split(","),
        price: parseFloat(price),
        stock: parseInt(stock),
        images: imageUrls,
        soldCount: 0,
        rating: 0,
      },
    });

    res.status(201).json(newlyCreatedProduct);
  } catch (e) {
    console.error("Product creation error:", e);
    const errorMessage = e instanceof Error ? e.message : "Some error occurred!";
    res.status(500).json({ success: false, message: errorMessage });
  }
};

//fetch all products (admin side)
export const fetchAllProductsForAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const fetchAllProducts = await prisma.product.findMany();
    res.status(200).json(fetchAllProducts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

//get a single product
export const getProductByID = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json(product);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
//update  a product (admin)
export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      brand,
      description,
      category,
      gender,
      sizes,
      colors,
      price,
      stock,
      rating,
      existingImages,
      imagesToDelete,
    } = req.body;

    // Get current product to check existing images
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!currentProduct) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    let finalImages: string[] = [];

    // Handle existing images
    if (existingImages) {
      try {
        const existingImagesArray = typeof existingImages === 'string' 
          ? JSON.parse(existingImages) 
          : existingImages;
        finalImages = existingImagesArray.filter((img: string) => 
          currentProduct.images.includes(img)
        );
      } catch (e) {
        // If parsing fails, use current images
        finalImages = currentProduct.images;
      }
    } else {
      // If no existingImages provided, keep all current images
      finalImages = currentProduct.images;
    }

    // Remove deleted images and delete them from Supabase
    if (imagesToDelete) {
      try {
        const imagesToDeleteArray = typeof imagesToDelete === 'string'
          ? JSON.parse(imagesToDelete)
          : imagesToDelete;
        
        if (Array.isArray(imagesToDeleteArray) && imagesToDeleteArray.length > 0) {
          console.log(`Deleting ${imagesToDeleteArray.length} image(s) from Supabase...`);
          
        // Delete images from Supabase Storage
          const deleteResults = await Promise.all(
            imagesToDeleteArray.map(async (imageUrl: string) => {
              const result = await deleteFromSupabase(imageUrl);
              if (!result.success) {
                console.warn(`Failed to delete image ${imageUrl}: ${result.error}`);
              }
              return result;
            })
          );
          
          const successCount = deleteResults.filter(r => r.success).length;
          const failCount = deleteResults.filter(r => !r.success).length;
          
          console.log(`Image deletion summary: ${successCount} succeeded, ${failCount} failed`);
          
          // Remove deleted images from final images array
        finalImages = finalImages.filter(
          (img: string) => !imagesToDeleteArray.includes(img)
        );
        }
      } catch (e) {
        console.error("Error parsing or processing imagesToDelete:", e);
        // Continue with update even if deletion fails
      }
    }

    // Upload new images if any
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      try {
        const uploadPromises = files.map(async (file) => {
          if (!file.buffer) {
            throw new Error(`File buffer is missing for file: ${file.originalname}`);
          }
          
          // Upload to Supabase Storage using file buffer
          const publicUrl = await uploadToSupabase(
            file.buffer,
            file.originalname,
            file.mimetype
          );
          
          return publicUrl;
        });

        const newImageUrls = await Promise.all(uploadPromises);
        finalImages = [...finalImages, ...newImageUrls];
      } catch (uploadError) {
        console.error("Supabase upload error:", uploadError);
        res.status(500).json({ 
          success: false, 
          message: "Failed to upload new images to Supabase." 
        });
        return;
      }
    }

    // Ensure at least one image remains
    if (finalImages.length === 0) {
      res.status(400).json({
        success: false,
        message: "Product must have at least one image",
      });
      return;
    }

    // Update product with new data and images
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        brand,
        category,
        description,
        gender,
        sizes: sizes.split(","),
        colors: colors.split(","),
        price: parseFloat(price),
        stock: parseInt(stock),
        rating: parseInt(rating),
        images: finalImages,
      },
    });

    res.status(200).json(product);
  } catch (e) {
    console.error("Product update error:", e);
    const errorMessage = e instanceof Error ? e.message : "Some error occurred!";
    res.status(500).json({ success: false, message: errorMessage });
  }
};
//delete a product (admin)
export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Fetch the product first to get the image URLs
    const product = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // Delete all product images from Supabase Storage
    if (product.images && product.images.length > 0) {
      console.log(`Deleting ${product.images.length} image(s) from Supabase for product ${id}...`);
      
      const deleteResults = await Promise.all(
        product.images.map(async (imageUrl: string) => {
          const result = await deleteFromSupabase(imageUrl);
          if (!result.success) {
            console.warn(`Failed to delete image ${imageUrl}: ${result.error}`);
          }
          return result;
        })
      );
      
      const successCount = deleteResults.filter(r => r.success).length;
      const failCount = deleteResults.filter(r => !r.success).length;
      
      console.log(`Product image deletion summary: ${successCount} succeeded, ${failCount} failed`);
    }

    // Delete the product from database
    await prisma.product.delete({ where: { id } });

    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};
//fetch products with filter (client)

export const getProductsForClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const categories = ((req.query.categories as string) || "")
      .split(",")
      .filter(Boolean);
    const brands = ((req.query.brands as string) || "")
      .split(",")
      .filter(Boolean);
    const sizes = ((req.query.sizes as string) || "")
      .split(",")
      .filter(Boolean);
    const colors = ((req.query.colors as string) || "")
      .split(",")
      .filter(Boolean);

    const minPrice = parseFloat(req.query.minPrice as string) || 0;
    const maxPrice =
      parseFloat(req.query.maxPrice as string) || Number.MAX_SAFE_INTEGER;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    const skip = (page - 1) * limit;

    const where: Prisma.productWhereInput = {
      AND: [
        categories.length > 0
          ? {
              category: {
                in: categories,
                mode: "insensitive",
              },
            }
          : {},
        brands.length > 0
          ? {
              brand: {
                in: brands,
                mode: "insensitive",
              },
            }
          : {},
        sizes.length > 0
          ? {
              sizes: {
                hasSome: sizes,
              },
            }
          : {},
        colors.length > 0
          ? {
              colors: {
                hasSome: colors,
              },
            }
          : {},
        {
          price: { gte: minPrice, lte: maxPrice },
        },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

// Search products
export const searchProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query, limit = "10" } = req.query;
    const searchQuery = (query as string) || "";
    const searchLimit = parseInt(limit as string) || 10;

    if (!searchQuery.trim()) {
      res.status(200).json({
        success: true,
        products: [],
        total: 0,
      });
      return;
    }

    const where: Prisma.productWhereInput = {
      OR: [
        {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          brand: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take: searchLimit,
        orderBy: {
          soldCount: "desc",
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      products,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

// Get related products
export const getRelatedProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { category: true, brand: true },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { category: product.category },
              { brand: product.brand },
            ],
          },
        ],
      },
      take: limit,
      orderBy: {
        soldCount: "desc",
      },
    });

    res.status(200).json({
      success: true,
      products: relatedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch related products" });
  }
};
