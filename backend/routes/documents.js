const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase, useSupabase } = require('../config/supabase');
const { Document } = require('../models/Notification');
const { authenticate, requirePermission } = require('../middleware/auth');
const { notifyUsers } = require('../sockets/notifyHelper');
const fs = require('fs');
const path = require('path');

let storage;

if (useSupabase) {
  storage = multer.memoryStorage();
} else {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 'image/png', 'image/jpeg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('File type not allowed'));
  },
});

router.use(authenticate);

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const { event, task } = req.query;
    const filter = {};
    if (event) filter.event = event;
    if (task) filter.task = task;
    const docs = await Document.find(filter)
      .populate('uploadedBy', 'name role')
      .populate('event', 'name')
      .sort({ createdAt: -1 });
    const accessible = docs.filter(doc => doc.canAccess(req.user));
    res.json(accessible);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/documents/upload
router.post('/upload', requirePermission('UPLOAD_DOCS'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { name, event, task, accessModel, allowedRoles, allowedUsers, canShareInChat, canPreview } = req.body;
    
    let fileUrl = '';
    let publicId = '';

    if (useSupabase) {
      const bucketName = process.env.SUPABASE_BUCKET || 'documents';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `${uniqueSuffix}-${req.file.originalname.replace(/\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          duplex: 'half'
        });
        
      if (error) {
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
        
      fileUrl = urlData.publicUrl;
      publicId = fileName;
    } else {
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      publicId = req.file.filename;
    }

    const doc = await Document.create({
      name: name || req.file.originalname,
      url: fileUrl,
      publicId: publicId,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      event,
      task,
      accessModel: accessModel || 'role',
      allowedRoles: allowedRoles ? JSON.parse(allowedRoles) : ['admin'],
      allowedUsers: allowedUsers ? JSON.parse(allowedUsers) : [],
      canShareInChat: canShareInChat !== 'false',
      canPreview: canPreview !== 'false',
    });
    await doc.populate('uploadedBy', 'name role');
    if (event) {
      const Event = require('../models/Event');
      const ev = await Event.findById(event);
      if (ev) {
        const io = req.app.get('io');
        await notifyUsers(io, ev.members, {
          type: 'file_uploaded',
          title: `File uploaded: ${doc.name}`,
          body: `${req.user.name} uploaded to ${ev.name}`,
          link: `/documents`,
          sender: req.user._id,
        });
      }
    }
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', requirePermission('DELETE_CONTENT'), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (doc.publicId) {
      if (useSupabase) {
        const bucketName = process.env.SUPABASE_BUCKET || 'documents';
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([doc.publicId]);
        if (error) {
          console.error('Supabase delete error:', error.message);
        }
      } else {
        const filePath = path.join(__dirname, '../uploads', doc.publicId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
    await doc.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/documents/:id/version
router.post('/:id/version', requirePermission('UPLOAD_DOCS'), upload.single('file'), async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    
    let fileUrl = '';
    let publicId = '';

    if (useSupabase) {
      const bucketName = process.env.SUPABASE_BUCKET || 'documents';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileName = `${uniqueSuffix}-${req.file.originalname.replace(/\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          duplex: 'half'
        });
        
      if (error) {
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
        
      fileUrl = urlData.publicUrl;
      publicId = fileName;
    } else {
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      publicId = req.file.filename;
    }

    doc.versions.push({ url: doc.url, uploadedBy: doc.uploadedBy, note: req.body.note });
    doc.url = fileUrl;
    doc.publicId = publicId;
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
