const express = require('express')
const {
  createLead,
  getLeads,
  getLeadById,
updateLeadStatus,
updateLeadNotes,
} = require('../controllers/leadController')
const { protect } = require('../middleware/auth')

const router = express.Router()

// Public - estimator submits lead
router.post('/', createLead)

// Owner dashboard - list leads
router.get('/', protect, getLeads)

// Owner dashboard - lead detail
router.get('/:id', protect, getLeadById)

// Owner dashboard - update lead status
router.patch('/:id/status', protect, updateLeadStatus)
router.patch('/:id/notes', protect, updateLeadNotes)

module.exports = router