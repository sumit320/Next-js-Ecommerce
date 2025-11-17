import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { uploadToSupabase, deleteFromSupabase } from "../utils/supabase";
import { prisma } from "../server";

export const addFeatureBanners = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const { title, subtitle, description, buttonText, buttonLink, showText } = req.body;

    if (!files || files.length === 0) {
      res.status(404).json({
        success: false,
        message: "No files provided",
      });
      return;
    }

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

    const imageUrls = await Promise.all(uploadPromises);

    // Parse text fields if they're JSON strings (from FormData)
    const parseField = (field: any) => {
      if (!field) return null;
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : field;
        } catch {
          return field;
        }
      }
      return Array.isArray(field) ? field : [field];
    };

    const titles = parseField(title) || [];
    const subtitles = parseField(subtitle) || [];
    const descriptions = parseField(description) || [];
    const buttonTexts = parseField(buttonText) || [];
    const buttonLinks = parseField(buttonLink) || [];
    const showTexts = parseField(showText) || [];

    const banners = await Promise.all(
      imageUrls.map((imageUrl, index) => {
        // Parse showText - default to true if not provided or if text fields are filled
        let showTextValue = true;
        if (showTexts[index] !== undefined) {
          showTextValue = showTexts[index] === 'true' || showTexts[index] === true;
        } else {
          // If showText not provided, check if any text is provided
          // If no text provided, default to false (image only)
          const hasText = titles[index] || subtitles[index] || descriptions[index] || buttonTexts[index];
          showTextValue = !!hasText;
        }

        return prisma.featureBanner.create({
          data: {
            imageUrl,
            title: titles[index] || null,
            subtitle: subtitles[index] || null,
            description: descriptions[index] || null,
            buttonText: buttonTexts[index] || "SHOP NOW",
            buttonLink: buttonLinks[index] || "/listing",
            showText: showTextValue,
          },
        });
      })
    );
    res.status(201).json({
      success: true,
      banners,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to add feature banners",
    });
  }
};

export const fetchFeatureBanners = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banners = await prisma.featureBanner.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      banners,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature banners",
    });
  }
};

export const updateFeaturedProducts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length > 8) {
      res.status(400).json({
        success: false,
        message: `Invalid product Id's or too many requests`,
      });
      return;
    }

    //reset all products to not featured
    await prisma.product.updateMany({
      data: { isFeatured: false },
    });

    //set selected product as featured
    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { isFeatured: true },
    });

    res.status(200).json({
      success: true,
      message: "Featured products updated successfully !",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to update feature products",
    });
  }
};

export const getFeaturedProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const featuredProducts = await prisma.product.findMany({
      where: { isFeatured: true },
      take: 20, // Limit to 20 featured products for performance
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        images: true,
        brand: true,
        stock: true,
        rating: true,
        isFeatured: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      featuredProducts,
    });
  } catch (e) {
    console.error("Error fetching featured products:", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feature products",
      featuredProducts: [], // Return empty array on error
    });
  }
};

export const updateBanner = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, buttonText, buttonLink, showText } = req.body;

    // Parse showText - default to true if not provided
    let showTextValue = true;
    if (showText !== undefined) {
      showTextValue = showText === 'true' || showText === true;
    } else {
      // If showText not provided, check if any text is provided
      const hasText = title || subtitle || description || buttonText;
      showTextValue = !!hasText;
    }

    const banner = await prisma.featureBanner.update({
      where: { id },
      data: {
        title: title || null,
        subtitle: subtitle || null,
        description: description || null,
        buttonText: buttonText || null,
        buttonLink: buttonLink || null,
        showText: showTextValue,
      },
    });

    res.status(200).json({
      success: true,
      banner,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to update banner",
    });
  }
};

export const deleteBanner = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch the banner first to get the image URL
    const banner = await prisma.featureBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      res.status(404).json({
        success: false,
        message: "Banner not found",
      });
      return;
    }

    // Delete the image from Supabase Storage
    if (banner.imageUrl) {
      await deleteFromSupabase(banner.imageUrl);
    }

    // Delete the banner from database
    await prisma.featureBanner.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to delete banner",
    });
  }
};

// Grid Items Controllers
export const addGridItems = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const { titles, subtitles, links, orders } = req.body;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "No files provided",
      });
      return;
    }

    const uploadPromises = files.map(async (file) => {
      if (!file.buffer) {
        throw new Error(`File buffer is missing for file: ${file.originalname}`);
      }
      
      const publicUrl = await uploadToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      
      return publicUrl;
    });

    const imageUrls = await Promise.all(uploadPromises);

    const parseField = (field: any) => {
      if (!field) return [];
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [field];
        }
      }
      return Array.isArray(field) ? field : [field];
    };

    const titlesArray = parseField(titles) || [];
    const subtitlesArray = parseField(subtitles) || [];
    const linksArray = parseField(links) || [];
    const ordersArray = parseField(orders) || [];

    const gridItems = await Promise.all(
      imageUrls.map((imageUrl, index) =>
        prisma.gridItem.create({
          data: {
            imageUrl,
            title: titlesArray[index] || `Item ${index + 1}`,
            subtitle: subtitlesArray[index] || "",
            link: linksArray[index] || null,
            order: ordersArray[index] ? parseInt(ordersArray[index]) : index,
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      gridItems,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to add grid items",
    });
  }
};

export const fetchGridItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const gridItems = await prisma.gridItem.findMany({
      orderBy: { order: "asc" },
    });

    res.status(200).json({
      success: true,
      gridItems,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch grid items",
    });
  }
};

export const updateGridItem = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, subtitle, link, order } = req.body;
    const file = req.file as Express.Multer.File;

    // Fetch current grid item to get old image URL
    const currentGridItem = await prisma.gridItem.findUnique({
      where: { id },
      select: { imageUrl: true },
    });

    if (!currentGridItem) {
      res.status(404).json({
        success: false,
        message: "Grid item not found",
      });
      return;
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (link !== undefined) updateData.link = link || null;
    if (order !== undefined) updateData.order = parseInt(order);

    // If a new image is uploaded, delete the old one from Supabase
    if (file && file.buffer) {
      // Delete old image from Supabase
      if (currentGridItem.imageUrl) {
        await deleteFromSupabase(currentGridItem.imageUrl);
      }
      
      // Upload new image
      const publicUrl = await uploadToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      updateData.imageUrl = publicUrl;
    }

    const gridItem = await prisma.gridItem.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      gridItem,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to update grid item",
    });
  }
};

export const deleteGridItem = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch the grid item first to get the image URL
    const gridItem = await prisma.gridItem.findUnique({
      where: { id },
    });

    if (!gridItem) {
      res.status(404).json({
        success: false,
        message: "Grid item not found",
      });
      return;
    }

    // Delete the image from Supabase Storage
    if (gridItem.imageUrl) {
      await deleteFromSupabase(gridItem.imageUrl);
    }

    // Delete the grid item from database
    await prisma.gridItem.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Grid item deleted successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to delete grid item",
    });
  }
};

// Listing Page Banner Controllers
export const addOrUpdateListingPageBanner = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File;
    const { title, subtitle } = req.body;

    console.log("Listing page banner request:", {
      hasFile: !!file,
      title,
      subtitle,
      body: req.body,
    });

    // Check if a banner already exists
    const existingBanner = await prisma.listingPageBanner.findFirst();

    // If no file is provided and no existing banner, require an image
    if (!file && !existingBanner) {
      res.status(400).json({
        success: false,
        message: "Please provide an image to create a new banner",
      });
      return;
    }

    if (file && file.buffer) {
      // Upload new image to Supabase
      const publicUrl = await uploadToSupabase(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      if (existingBanner) {
        // Delete old image from Supabase if it exists
        if (existingBanner.imageUrl) {
          await deleteFromSupabase(existingBanner.imageUrl).catch((error) => {
            console.error(`Failed to delete old banner image: ${error}`);
            // Continue even if deletion fails
          });
        }

        // Update existing banner
        const updatedBanner = await prisma.listingPageBanner.update({
          where: { id: existingBanner.id },
          data: {
            imageUrl: publicUrl,
            title: title !== undefined ? (title || null) : existingBanner.title,
            subtitle: subtitle !== undefined ? (subtitle || null) : existingBanner.subtitle,
          },
        });

        res.status(200).json({
          success: true,
          banner: updatedBanner,
          message: "Listing page banner updated successfully",
        });
      } else {
        // Create new banner
        const newBanner = await prisma.listingPageBanner.create({
          data: {
            imageUrl: publicUrl,
            title: title || null,
            subtitle: subtitle || null,
          },
        });

        res.status(201).json({
          success: true,
          banner: newBanner,
          message: "Listing page banner created successfully",
        });
      }
    } else if (existingBanner) {
      // Update only text fields without changing image
      // title and subtitle are always sent (even as empty strings), so we check if they're different
      const titleValue = title !== undefined ? (title === "" ? null : title) : existingBanner.title;
      const subtitleValue = subtitle !== undefined ? (subtitle === "" ? null : subtitle) : existingBanner.subtitle;
      
      const updatedBanner = await prisma.listingPageBanner.update({
        where: { id: existingBanner.id },
        data: {
          title: titleValue,
          subtitle: subtitleValue,
        },
      });

      res.status(200).json({
        success: true,
        banner: updatedBanner,
        message: "Listing page banner updated successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Please provide an image to create a new banner",
      });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to add/update listing page banner",
    });
  }
};

export const fetchListingPageBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banner = await prisma.listingPageBanner.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      banner: banner || null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch listing page banner",
    });
  }
};

export const deleteListingPageBanner = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch the banner first to get the image URL
    const banner = await prisma.listingPageBanner.findUnique({
      where: { id },
    });

    if (!banner) {
      res.status(404).json({
        success: false,
        message: "Banner not found",
      });
      return;
    }

    // Delete the image from Supabase Storage
    if (banner.imageUrl) {
      const deleteResult = await deleteFromSupabase(banner.imageUrl);
      if (!deleteResult.success) {
        console.warn(`Failed to delete banner image from Supabase: ${deleteResult.error}`);
        // Continue with database deletion even if Supabase deletion fails
      }
    }

    // Delete the banner from database
    await prisma.listingPageBanner.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Listing page banner deleted successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to delete listing page banner",
    });
  }
};

// Grid Section Settings Controllers
export const getGridSectionSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the first (and only) settings record, or return default values
    const settings = await prisma.gridSectionSettings.findFirst();

    res.status(200).json({
      success: true,
      settings: settings || { title: null, subtitle: null },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch grid section settings",
    });
  }
};

export const updateGridSectionSettings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, subtitle } = req.body;

    // Find existing settings or create new one (singleton pattern)
    const existing = await prisma.gridSectionSettings.findFirst();
    
    let settings;
    if (existing) {
      // Update existing settings
      settings = await prisma.gridSectionSettings.update({
        where: { id: existing.id },
        data: {
          title: title !== undefined ? (title === "" ? null : title) : existing.title,
          subtitle: subtitle !== undefined ? (subtitle === "" ? null : subtitle) : existing.subtitle,
        },
      });
    } else {
      // Create new settings
      settings = await prisma.gridSectionSettings.create({
        data: {
          title: title || null,
          subtitle: subtitle || null,
        },
      });
    }

    res.status(200).json({
      success: true,
      settings,
      message: "Grid section settings updated successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to update grid section settings",
    });
  }
};
