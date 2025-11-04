import CourseMaterial from '../models/CourseMaterial.js';
import { generateEmbeddings } from '../services/embeddingService.js';
import { chunkText, countWords, isValidChunk } from '../utils/textChunker.js';

/**
 * @desc    Process course material (generate embeddings and store)
 * @route   POST /api/v1/study/materials/process
 * @access  Private
 */
export const processMaterial = async (req, res) => {
  try {
    const { title, topic, subject, textChunks } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!title || !topic) {
      return res.status(400).json({
        success: false,
        error: 'Title and topic are required'
      });
    }

    if (!textChunks || !Array.isArray(textChunks) || textChunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text chunks are required and must be a non-empty array'
      });
    }

    // Validate chunks
    const validChunks = textChunks.filter(chunk => {
      return chunk.content && isValidChunk(chunk.content);
    });

    if (validChunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid text chunks provided'
      });
    }

    // Create material document with processing status
    const material = await CourseMaterial.create({
      user: userId,
      title,
      topic,
      subject: subject || 'General',
      status: 'processing',
      chunks: []
    });

    // Generate embeddings for all chunks
    try {
      const chunkTexts = validChunks.map(chunk => chunk.content);
      const embeddings = await generateEmbeddings(chunkTexts);

      // Prepare chunks with embeddings
      const chunksWithEmbeddings = validChunks.map((chunk, index) => ({
        content: chunk.content,
        order: chunk.order !== undefined ? chunk.order : index,
        embedding: embeddings[index],
        wordCount: countWords(chunk.content),
        metadata: chunk.metadata || {}
      }));

      // Update material with chunks
      material.chunks = chunksWithEmbeddings;
      material.status = 'ready';
      material.calculateStats();
      await material.save();

      res.status(201).json({
        success: true,
        message: 'Material processed successfully',
        material: {
          id: material._id,
          title: material.title,
          topic: material.topic,
          subject: material.subject,
          chunkCount: material.chunkCount,
          wordCount: material.wordCount,
          status: material.status,
          createdAt: material.createdAt
        }
      });
    } catch (embeddingError) {
      // Update material status to failed
      material.status = 'failed';
      material.error = embeddingError.message;
      await material.save();

      throw embeddingError;
    }
  } catch (error) {
    console.error('Process material error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process material',
      details: error.message
    });
  }
};

/**
 * @desc    Get all materials for user
 * @route   GET /api/v1/study/materials
 * @access  Private
 */
export const getMaterials = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topic, subject, status } = req.query;

    // Build filter
    const filter = { user: userId };

    if (topic) filter.topic = topic;
    if (subject) filter.subject = subject;
    if (status) filter.status = status;

    const materials = await CourseMaterial.find(filter)
      .select('-chunks.embedding') // Exclude embeddings from list view
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: materials.length,
      materials: materials.map(m => ({
        id: m._id,
        title: m.title,
        topic: m.topic,
        subject: m.subject,
        chunkCount: m.chunkCount,
        wordCount: m.wordCount,
        status: m.status,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch materials'
    });
  }
};

/**
 * @desc    Get specific material by ID
 * @route   GET /api/v1/study/materials/:id
 * @access  Private
 */
export const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const material = await CourseMaterial.findOne({
      _id: id,
      user: userId
    }).select('-chunks.embedding'); // Exclude embeddings for performance

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }

    res.json({
      success: true,
      material: {
        id: material._id,
        title: material.title,
        topic: material.topic,
        subject: material.subject,
        chunkCount: material.chunkCount,
        wordCount: material.wordCount,
        status: material.status,
        chunks: material.chunks.map(c => ({
          id: c._id,
          content: c.content,
          order: c.order,
          wordCount: c.wordCount
        })),
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      }
    });
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch material'
    });
  }
};

/**
 * @desc    Delete material
 * @route   DELETE /api/v1/study/materials/:id
 * @access  Private
 */
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const material = await CourseMaterial.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete material'
    });
  }
};

/**
 * @desc    Update material metadata
 * @route   PATCH /api/v1/study/materials/:id
 * @access  Private
 */
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, topic, subject } = req.body;

    const updateFields = {};
    if (title) updateFields.title = title;
    if (topic) updateFields.topic = topic;
    if (subject) updateFields.subject = subject;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const material = await CourseMaterial.findOneAndUpdate(
      { _id: id, user: userId },
      updateFields,
      { new: true, select: '-chunks.embedding' }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Material not found'
      });
    }

    res.json({
      success: true,
      message: 'Material updated successfully',
      material: {
        id: material._id,
        title: material.title,
        topic: material.topic,
        subject: material.subject,
        updatedAt: material.updatedAt
      }
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update material'
    });
  }
};

export default {
  processMaterial,
  getMaterials,
  getMaterialById,
  deleteMaterial,
  updateMaterial
};
