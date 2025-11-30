const express = require('express');
const router = express.Router();
const TrainingLocation = require('../models/TrainingLocations');
const { Op } = require('sequelize');


const sanitizeLocation = (location) => {
  try {
    const locationData = location.toJSON ? location.toJSON() : location;
    
    
    const sanitized = {
      ...locationData,
      slug: locationData.slug || '',
      title: locationData.title || '',
      location: locationData.location || '',
      course: locationData.course || '',
      description: locationData.description || '',
      highlights: Array.isArray(locationData.highlights) ? locationData.highlights.filter(h => h) : [],
      duration: locationData.duration || '',
      mode: locationData.mode || 'Online & Offline',
      fees: locationData.fees || 'Contact for details',
      isSAP: locationData.isSAP === true,
      category: locationData.category || '',
      metaTitle: locationData.metaTitle || '',
      metaDescription: locationData.metaDescription || '',
      metaKeywords: locationData.metaKeywords || '',
      isActive: locationData.isActive !== false,
      company_logos: Array.isArray(locationData.company_logos) ? locationData.company_logos : [],
      content_data: locationData.content_data || null
    };
    
    return sanitized;
  } catch (error) {
    console.error('Error sanitizing location:', error);
    return location; 
  }
};

// GET all locations 
router.get('/api/locations', async (req, res) => {
  try {
    const { category, isSAP, isActive = 'true' } = req.query;
    
    let where = { isActive: isActive === 'true' };
    
    if (category) {
      where.category = category;
    }
    
    if (isSAP !== undefined) {
      where.isSAP = isSAP === 'true';
    }
    
    const locations = await TrainingLocation.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    
    // 🔧 Sanitize all locations before sending
    const sanitizedLocations = locations.map(loc => sanitizeLocation(loc));
    
    res.json({
      success: true,
      count: sanitizedLocations.length,
      data: sanitizedLocations
    });
    
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET single location by slug
router.get('/api/locations/:slug', async (req, res) => {
  try {
    const location = await TrainingLocation.findOne({
      where: { 
        slug: req.params.slug,
        isActive: true 
      }
    });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    
    // 🔧 Sanitize before sending
    const sanitized = sanitizeLocation(location);
    
    res.json({
      success: true,
      data: sanitized
    });
    
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST create new location
router.post('/api/locations', async (req, res) => {
  try {
    const {
      slug,
      title,
      location,
      course,
      description,
      highlights,
      duration,
      mode,
      fees,
      isSAP,
      category,
      metaTitle,
      metaDescription,
      metaKeywords,
      isActive,
      content_data,
      company_logos
    } = req.body;
    
    // Validation for required fields
    if (!slug || !title || !location || !course || !description || !duration || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Filter and validate highlights - remove empty strings
    const filteredHighlights = Array.isArray(highlights) 
      ? highlights.filter(h => h && typeof h === 'string' && h.trim() !== '')
      : [];
    
    if (filteredHighlights.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one highlight is required'
      });
    }
    
    
    const existingLocation = await TrainingLocation.findOne({ where: { slug } });
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        error: 'Slug already exists'
      });
    }
    
    // Validate and filter company_logos
    let validCompanyLogos = [];
    if (Array.isArray(company_logos)) {
      validCompanyLogos = company_logos.filter(logo => 
        logo && 
        typeof logo === 'object' && 
        logo.name && 
        typeof logo.name === 'string'
      );
    }
    
    // Validate content_data serialization
    let validContentData = null;
    if (content_data) {
      try {
        JSON.stringify(content_data); 
        validContentData = content_data;
      } catch (jsonError) {
        console.error('Invalid content_data:', jsonError);
        console.log('Received content_data:', content_data);
        return res.status(400).json({
          success: false,
          error: 'Invalid content_data format. Please check for circular references.'
        });
      }
    }
    
    // Create new location with validated data
    const newLocation = await TrainingLocation.create({
      slug,
      title,
      location,
      course,
      description,
      highlights: filteredHighlights,
      duration,
      mode: mode || 'Online & Offline',
      fees: fees || 'Contact for details',
      isSAP: isSAP === true,
      category,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      metaKeywords: metaKeywords || null,
      content_data: validContentData,
      company_logos: validCompanyLogos,
      isActive: isActive !== false
    });
    
    console.log(`Created new location: ${slug} (isSAP: ${isSAP}, highlights: ${filteredHighlights.length})`);
    
    // Sanitize before sending response
    const sanitized = sanitizeLocation(newLocation);
    
    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: sanitized
    });
    
  } catch (error) {
    console.error('Error creating location:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Slug already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${error.message}`,
        details: error.errors?.map(e => e.message) || []
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create location'
    });
  }
});

// PUT update location 
router.put('/api/locations/:slug', async (req, res) => {
  try {
    const location = await TrainingLocation.findOne({ 
      where: { slug: req.params.slug } 
    });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    
    const {
      title,
      location: locationName,
      course,
      description,
      highlights,
      duration,
      mode,
      fees,
      isSAP,
      category,
      metaTitle,
      metaDescription,
      metaKeywords,
      isActive,
      content_data,
      company_logos
    } = req.body;
    
    // Validate required fields when provided
    if (title !== undefined && !title) {
      return res.status(400).json({
        success: false,
        error: 'Title cannot be empty'
      });
    }
    
    if (category !== undefined && !category) {
      return res.status(400).json({
        success: false,
        error: 'Category cannot be empty'
      });
    }
    
    // Validate highlights if provided
    if (highlights !== undefined) {
      const filteredHighlights = highlights.filter(h => h && h.trim() !== '');
      if (filteredHighlights.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one highlight is required'
        });
      }
    }
    
    // Build update data object - safely handle each field
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (locationName !== undefined) updateData.location = locationName;
    if (course !== undefined) updateData.course = course;
    if (description !== undefined) updateData.description = description;
    
    if (highlights !== undefined) {
      updateData.highlights = highlights.filter(h => h && h.trim() !== '');
    }
    
    if (duration !== undefined) updateData.duration = duration;
    if (mode !== undefined) updateData.mode = mode;
    if (fees !== undefined) updateData.fees = fees;
    if (isSAP !== undefined) updateData.isSAP = isSAP;
    if (category !== undefined) updateData.category = category;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Handle content_data - safe JSON serialization for SAP and non-SAP
    if (content_data !== undefined) {
      if (content_data === null) {
        updateData.content_data = null;
      } else {
        try {
          // Ensure it's valid JSON-serializable
          const testSerialize = JSON.stringify(content_data);
          updateData.content_data = content_data;
        } catch (jsonError) {
          console.error(`Error with content_data for ${req.params.slug}:`, jsonError);
          return res.status(400).json({
            success: false,
            error: 'Invalid content_data format. Please check for circular references or non-serializable objects.'
          });
        }
      }
    }
    
    // Handle company_logos
    if (company_logos !== undefined) {
      if (Array.isArray(company_logos)) {
        updateData.company_logos = company_logos.filter(logo => logo && logo.name);
      } else {
        updateData.company_logos = [];
      }
    }
    
    // Log the update for debugging
    console.log(`Updating location: ${req.params.slug}, isSAP: ${updateData.isSAP}, hasContentData: ${!!updateData.content_data}`);
    
    await location.update(updateData);
    
    // Reload to get fresh data
    await location.reload();
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
    
  } catch (error) {
    console.error('Error updating location:', error);
    
    // Provide specific error messages for common issues
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        error: `Validation error: ${error.message}`,
        details: error.errors?.map(e => e.message) || []
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update location'
    });
  }
});

// DELETE location (soft delete)
router.delete('/api/locations/:slug', async (req, res) => {
  try {
    const location = await TrainingLocation.findOne({ 
      where: { slug: req.params.slug } 
    });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    
    await location.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET categories list
router.get('/api/locations/categories/list', async (req, res) => {
  try {
    const locations = await TrainingLocation.findAll({
      attributes: ['category'],
      group: ['category']
    });
    
    const categories = locations.map(loc => loc.category);
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET related locations
router.get('/api/locations/:slug/related', async (req, res) => {
  try {
    const currentLocation = await TrainingLocation.findOne({ 
      where: { 
        slug: req.params.slug,
        isActive: true 
      }
    });
    
    if (!currentLocation) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }
    
    const relatedLocations = await TrainingLocation.findAll({
      where: {
        slug: { [Op.ne]: req.params.slug },
        isActive: true,
        [Op.or]: [
          { category: currentLocation.category },
          { course: currentLocation.course }
        ]
      },
      limit: 8
    });
    
    res.json({
      success: true,
      count: relatedLocations.length,
      data: relatedLocations
    });
    
  } catch (error) {
    console.error('Error fetching related locations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;