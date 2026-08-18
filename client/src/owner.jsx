import { useEffect, useState } from 'react'


const KNOWN_PRICING_FIELDS = {
  material: { key: 'rate', label: 'Rate ($ per unit)' },
  pitch: { key: 'multiplier', label: 'Multiplier' },
  layers: { key: 'tearOffRate', label: 'Tear-off rate ($ per unit)' },
  stories: { key: 'multiplier', label: 'Multiplier' },
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
}

function QuestionFormModal({ question, existingKeys, saving, onCancel, onSave }) {
  const isEditing = Boolean(question)

  const [label, setLabel] = useState(question?.label || '')
  const [key, setKey] = useState(question?.key || '')
  const [type, setType] = useState(question?.type || 'select')
  const [unit, setUnit] = useState(question?.unit || '')
  const [min, setMin] = useState(question?.min ?? '')
  const [max, setMax] = useState(question?.max ?? '')
  const [required, setRequired] = useState(question?.required ?? true)
  const [options, setOptions] = useState(
    question?.options?.length ? question.options : [{ key: '', label: '' }]
  )
  const [formError, setFormError] = useState('')

  const pricingField = KNOWN_PRICING_FIELDS[key] || { key: 'value', label: 'Value' }
  const isKnownPricingKey = Boolean(KNOWN_PRICING_FIELDS[key])

  function handleLabelChange(value) {
    setLabel(value)
    if (!isEditing) {
      setKey(slugify(value))
    }
  }

  function updateOption(index, field, value) {
    setOptions((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addOption() {
    setOptions((prev) => [...prev, { key: '', label: '' }])
  }

  function removeOption(index) {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!label.trim()) {
      setFormError('Question text is required.')
      return
    }

    if (!key.trim()) {
      setFormError('Could not generate a key from that label — try adding a letter or number.')
      return
    }

    if (!isEditing && existingKeys.includes(key)) {
      setFormError('A question with this key already exists.')
      return
    }

    if (type === 'select' && options.filter((o) => o.label.trim()).length < 2) {
      setFormError('Multiple-choice questions need at least two options.')
      return
    }

    const questionData = {
      key,
      label: label.trim(),
      type,
      required,
    }

    if (type === 'number') {
      questionData.unit = unit
      if (min !== '') questionData.min = Number(min)
      if (max !== '') questionData.max = Number(max)
    } else {
      questionData.options = options
        .filter((o) => o.label.trim())
        .map((o) => ({
          ...o,
          key: o.key || slugify(o.label),
        }))
    }

    onSave(questionData)
  }

  return (
    <div className="question-modal-backdrop">
      <div className="question-modal">
        <h2>{isEditing ? 'Edit Question' : 'Add Question'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="question-form-field">
            <label>Question text</label>
            <input
              type="text"
              value={label}
              onChange={(event) => handleLabelChange(event.target.value)}
              placeholder="e.g. What is your roof size?"
            />
          </div>

          <div className="question-form-field">
            <label>Internal key</label>
            <input
              type="text"
              value={key}
              disabled={isEditing}
              onChange={(event) => setKey(event.target.value)}
            />
            {isEditing && (
              <p className="question-form-hint">
                Locked while editing — changing it would disconnect this question from leads
                that already answered it.
              </p>
            )}
          </div>

          <div className="question-form-row">
            <div className="question-form-field">
              <label>Type</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                disabled={isEditing}
              >
                <option value="select">Multiple choice</option>
                <option value="number">Number</option>
              </select>
            </div>

            <div className="question-form-field question-form-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(event) => setRequired(event.target.checked)}
                />
                {' '}Required
              </label>
            </div>
          </div>

          {type === 'number' ? (
            <div className="question-form-row">
              <div className="question-form-field">
                <label>Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="sq ft"
                />
              </div>
              <div className="question-form-field">
                <label>Min</label>
                <input type="number" value={min} onChange={(event) => setMin(event.target.value)} />
              </div>
              <div className="question-form-field">
                <label>Max</label>
                <input type="number" value={max} onChange={(event) => setMax(event.target.value)} />
              </div>
            </div>
          ) : (
            <div className="question-form-field">
              <label>Options</label>

              {!isKnownPricingKey && (
                <p className="question-form-hint">
                  This isn't one of the pricing-connected questions (material, pitch, layers,
                  stories), so a developer needs to wire it into the calculator before it affects
                  the estimate. It will still appear on the estimator page immediately.
                </p>
              )}

              {options.map((option, index) => (
                <div key={index} className="question-option-row">
                  <input
                    type="text"
                    placeholder="Option label"
                    value={option.label}
                    onChange={(event) => updateOption(index, 'label', event.target.value)}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder={pricingField.label}
                    value={option[pricingField.key] ?? ''}
                    onChange={(event) =>
                      updateOption(index, pricingField.key, Number(event.target.value))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button type="button" className="btn-secondary" onClick={addOption}>
                + Add option
              </button>
            </div>
          )}

          {formError && <p className="validation-error">{formError}</p>}

          <div className="question-form-actions">
            <button type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Owner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [token, setToken] = useState(
    localStorage.getItem('ownerToken')
  )

  const [activeTab, setActiveTab] = useState('leads')

  const [leads, setLeads] = useState([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsError, setLeadsError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // detailOpen controls whether the card is shown at all.
  // selectedLead only controls what data is shown INSIDE it.
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState('')

  const [notes, setNotes] = useState('')
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState('')

  // --- Question management state ---------------------------------------
  const [config, setConfig] = useState(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configError, setConfigError] = useState('')
  const [configSaving, setConfigSaving] = useState(false)
  const [configMessage, setConfigMessage] = useState('')

  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editingQuestionKey, setEditingQuestionKey] = useState(null)
  // -----------------------------------------------------------------------

  async function handleLogin(event) {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        'https://roofing-leads-estimator.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('ownerToken', data.token)
      setToken(data.token)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function fetchLeads() {
    const savedToken = localStorage.getItem('ownerToken')

    if (!savedToken) {
      return
    }

    setLeadsLoading(true)
    setLeadsError('')

    try {
      const response = await fetch(
        'https://roofing-leads-estimator.onrender.com/api/leads',
        {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load leads'
        )
      }

      setLeads(data)
    } catch (err) {
      console.error(err)
      setLeadsError(
        err.message || 'Unable to load leads'
      )
    } finally {
      setLeadsLoading(false)
    }
  }

  async function fetchLeadDetails(leadId) {
    const savedToken = localStorage.getItem('ownerToken')

    if (!savedToken) {
      return
    }

    if (!leadId) {
      console.error('fetchLeadDetails called without a leadId')
      setDetailError('Could not open this lead (missing id).')
      return
    }

    setDetailLoading(true)
    setDetailError('')
    setSelectedLead(null)

    try {
      const response = await fetch(
        `https://roofing-leads-estimator.onrender.com/api/leads/${leadId}`,
        {
          headers: {
            Authorization: 'Bearer ' + savedToken,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load lead details'
        )
      }

      setSelectedLead(data)
      setNotes(data.notes || '')
    } catch (err) {
      console.error(err)
      setDetailError(
        err.message || 'Unable to load lead details'
      )
    } finally {
      setDetailLoading(false)
    }
  }

  async function updateLeadStatus(newStatus) {
    if (!selectedLead?._id) {
      return
    }

    const savedToken = localStorage.getItem('ownerToken')

    if (!savedToken) {
      return
    }

    setStatusLoading(true)
    setStatusError('')

    try {
      const response = await fetch(
        `https://roofing-leads-estimator.onrender.com/api/leads/${selectedLead._id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + savedToken,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update lead status'
        )
      }

      setSelectedLead(data)

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead._id === data._id
            ? { ...lead, status: data.status }
            : lead
        )
      )
    } catch (err) {
      console.error(err)
      setStatusError(
        err.message || 'Unable to update status'
      )
    } finally {
      setStatusLoading(false)
    }
  }

  async function updateLeadNotes() {
    if (!selectedLead?._id) {
      return
    }

    const savedToken = localStorage.getItem('ownerToken')

    if (!savedToken) {
      return
    }

    setNotesLoading(true)
    setNotesError('')

    try {
      const response = await fetch(
        `https://roofing-leads-estimator.onrender.com/api/leads/${selectedLead._id}/notes`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + savedToken,
          },
          body: JSON.stringify({
            notes,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to save notes'
        )
      }

      setSelectedLead(data)
      setNotes(data.notes || '')
    } catch (err) {
      console.error(err)
      setNotesError(
        err.message || 'Unable to save notes'
      )
    } finally {
      setNotesLoading(false)
    }
  }

  function openLeadDetail(leadId) {
    setDetailOpen(true)
    fetchLeadDetails(leadId)
  }

  function closeLeadDetail() {
    setDetailOpen(false)
    setSelectedLead(null)
    setDetailError('')
  }

  // --- Question management functions ------------------------------------

  async function fetchConfig() {
    const savedToken = localStorage.getItem('ownerToken')
    if (!savedToken) return

    setConfigLoading(true)
    setConfigError('')

    try {
      const response = await fetch('https://roofing-leads-estimator.onrender.com/api/config/full', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load questions')
      }

      setConfig(data)
    } catch (err) {
      console.error(err)
      setConfigError(err.message || 'Unable to load questions')
    } finally {
      setConfigLoading(false)
    }
  }

  // Saves the whole config back with an updated `questions` array.
  // Centralizing every mutation (add/edit/toggle/reorder) through this one
  // function means there's a single place that talks to the backend, and
  // the local `config` state always mirrors exactly what's persisted.
  async function saveConfig(nextQuestions, successMessage) {
    const savedToken = localStorage.getItem('ownerToken')
    if (!savedToken || !config) return false

    setConfigSaving(true)
    setConfigError('')
    setConfigMessage('')

    try {
      const response = await fetch('https://roofing-leads-estimator.onrender.com/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({
          ...config,
          questions: nextQuestions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save questions')
      }

      setConfig(data)
      setConfigMessage(successMessage || 'Saved.')
      return true
    } catch (err) {
      console.error(err)
      setConfigError(err.message || 'Unable to save questions')
      return false
    } finally {
      setConfigSaving(false)
    }
  }

  // Enable/Disable: flips `active` only. The question object, its key,
  // and every lead that already answered it are untouched.
  function toggleQuestionActive(key) {
    if (!config) return
    const nextQuestions = config.questions.map((q) =>
      q.key === key ? { ...q, active: !q.active } : q
    )
    saveConfig(
      nextQuestions,
      `"${config.questions.find((q) => q.key === key)?.label}" is now ${
        nextQuestions.find((q) => q.key === key).active ? 'visible' : 'hidden'
      } on the estimator.`
    )
  }

  function moveQuestion(key, direction) {
    if (!config) return
    const sorted = [...config.questions].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((q) => q.key === key)
    const swapWith = direction === 'up' ? index - 1 : index + 1

    if (swapWith < 0 || swapWith >= sorted.length) return

    const a = sorted[index]
    const b = sorted[swapWith]

    const nextQuestions = config.questions.map((q) => {
      if (q.key === a.key) return { ...q, order: b.order }
      if (q.key === b.key) return { ...q, order: a.order }
      return q
    })

    saveConfig(nextQuestions, 'Question order updated.')
  }

 
  function upsertQuestion(questionData) {
    if (!config) return

    const exists = config.questions.some((q) => q.key === questionData.key)
    let nextQuestions

    if (exists) {
      nextQuestions = config.questions.map((q) =>
        q.key === questionData.key ? { ...q, ...questionData } : q
      )
    } else {
      const maxOrder = config.questions.reduce(
        (max, q) => Math.max(max, q.order || 0),
        0
      )
      nextQuestions = [
        ...config.questions,
        { ...questionData, active: true, order: maxOrder + 1 },
      ]
    }

    saveConfig(nextQuestions, exists ? 'Question updated.' : 'Question added.').then(
      (ok) => {
        if (ok) {
          setShowQuestionForm(false)
          setEditingQuestionKey(null)
        }
      }
    )
  }

  // -----------------------------------------------------------------------

  useEffect(() => {
    if (token) {
      fetchLeads()
    }
  }, [token])

  useEffect(() => {
    if (token && activeTab === 'questions' && !config) {
      fetchConfig()
    }
  }, [token, activeTab, config])

  function handleLogout() {
    localStorage.removeItem('ownerToken')
    setToken(null)
    setLeads([])
  }

  if (!token) {
    return (
      <div className="owner-login">
        <div className="owner-login-card">

          <h1>Owner Login</h1>

          <p>
            Sign in to manage your roofing leads.
          </p>

          <form onSubmit={handleLogin}>

            <div>
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="owner@example.com"
                required
              />
            </div>

            <div>
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <p className="validation-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign In'}
            </button>

          </form>

        </div>
      </div>
    )
  }

  const filteredLeads = leads.filter((lead) => {
    const search = searchTerm.toLowerCase().trim()

    const matchesSearch =
      !search ||
      lead.name?.toLowerCase().includes(search) ||
      lead.phone?.toLowerCase().includes(search) ||
      lead.email?.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'all' ||
      (lead.status || 'new') === statusFilter

    return matchesSearch && matchesStatus
  })

  const newLeads = leads.filter(
    (lead) => lead.status === 'new'
  ).length

  const estimates = leads
    .filter((lead) => lead.estimate?.midpoint)
    .map((lead) => lead.estimate.midpoint)

  const averageEstimate =
    estimates.length > 0
      ? Math.round(
          estimates.reduce(
            (sum, value) => sum + value,
            0
          ) / estimates.length
        )
      : 0

  const sortedQuestions = config
    ? [...config.questions].sort((a, b) => a.order - b.order)
    : []

  return (
    <div className="owner-dashboard">

      {detailOpen && (
        <div className="lead-detail-card">

          <div className="lead-detail-header">
            <div>
              <h2>{selectedLead?.name || 'Lead details'}</h2>
              {selectedLead?.email && <p>{selectedLead.email}</p>}
            </div>

            <button
              type="button"
              onClick={closeLeadDetail}
            >
              Back to Leads
            </button>
          </div>

          {detailLoading && (
            <p>Loading lead details...</p>
          )}

          {detailError && (
            <p className="validation-error">
              {detailError}
            </p>
          )}

          {!detailLoading && !detailError && selectedLead && (
            <>
              <div className="lead-detail-section">
                <h3>Contact Information</h3>

                <p>
                  <strong>Name:</strong> {selectedLead.name}
                </p>

                <p>
                  <strong>Phone:</strong> {selectedLead.phone}
                </p>

                <p>
                  <strong>Email:</strong> {selectedLead.email}
                </p>
              </div>

              <div className="lead-detail-section">
                <h3>Roof Information</h3>

                {selectedLead.answers?.map((answer) => (
                  <p key={answer.questionKey}>
                    <strong>
                      {answer.label || answer.questionKey}:
                    </strong>{' '}
                    {answer.displayValue || answer.value || '-'}
                  </p>
                ))}
              </div>

              {selectedLead.estimate && (
                <div className="lead-detail-section">
                  <h3>Estimate</h3>

                  <p>
                    <strong>Low:</strong>{' '}
                    ${selectedLead.estimate.low.toLocaleString()}
                  </p>

                  <p>
                    <strong>High:</strong>{' '}
                    ${selectedLead.estimate.high.toLocaleString()}
                  </p>

                  {selectedLead.estimate.midpoint && (
                    <p>
                      <strong>Midpoint:</strong>{' '}
                      ${selectedLead.estimate.midpoint.toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <div className="lead-detail-section">
                <h3>Status</h3>

                <p>
                  Current status:{' '}
                  <strong>
                    {selectedLead.status || 'new'}
                  </strong>
                </p>

                {statusError && (
                  <p className="validation-error">
                    {statusError}
                  </p>
                )}

                <select
                  value={selectedLead.status || 'new'}
                  onChange={(event) =>
                    updateLeadStatus(event.target.value)
                  }
                  disabled={statusLoading}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>

                {statusLoading && (
                  <p>Updating status...</p>
                )}
              </div>

              <div className="lead-detail-section">
                <h3>Notes</h3>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Add notes about this lead..."
                  rows="5"
                />

                {notesError && (
                  <p className="validation-error">
                    {notesError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={updateLeadNotes}
                  disabled={notesLoading}
                >
                  {notesLoading ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="owner-header">

        <div>
          <h1>Owner Dashboard</h1>
          <p>Roofing Leads</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

      <div className="owner-tabs">
        <button
          type="button"
          className={activeTab === 'leads' ? 'owner-tab active' : 'owner-tab'}
          onClick={() => setActiveTab('leads')}
        >
          Leads
        </button>
        <button
          type="button"
          className={activeTab === 'questions' ? 'owner-tab active' : 'owner-tab'}
          onClick={() => setActiveTab('questions')}
        >
          Estimator Questions
        </button>
      </div>

      {activeTab === 'leads' && (
        <>
          <div className="dashboard-stats">

            <div className="stat-card">
              <span>Total Leads</span>
              <strong>{leads.length}</strong>
            </div>

            <div className="stat-card">
              <span>New Leads</span>
              <strong>{newLeads}</strong>
            </div>

            <div className="stat-card">
              <span>Average Estimate</span>
              <strong>
                {averageEstimate
                  ? `$${averageEstimate.toLocaleString()}`
                  : '-'}
              </strong>
            </div>

          </div>

          <div className="leads-card">
            <div className="leads-card-header">

              <div>
                <h2>Leads</h2>

                <p>
                  Total leads: {leads.length}
                </p>
              </div>

              <div className="lead-filters">

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search name, phone or email..."
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>

              </div>

              <button
                type="button"
                onClick={fetchLeads}
                disabled={leadsLoading}
              >
                {leadsLoading ? 'Refreshing...' : 'Refresh'}
              </button>

            </div>

            {leadsError && (
              <p className="validation-error">
                {leadsError}
              </p>
            )}

            {leadsLoading ? (
              <p>Loading leads...</p>
            ) : filteredLeads.length === 0 ? (
              <p>No matching leads found.</p>
            ) : (
              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Roof Size</th>
                      <th>Material</th>
                      <th>Estimate</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredLeads.map((lead) => {

                      const roofSize =
                        lead.answers?.find(
                          (answer) =>
                            answer.questionKey === 'roofSize'
                        )

                      const material =
                        lead.answers?.find(
                          (answer) =>
                            answer.questionKey === 'material'
                        )

                      return (
                        <tr
                          key={lead._id}
                          onClick={() => openLeadDetail(lead._id)}
                          style={{ cursor: 'pointer' }}
                        >

                          <td>{lead.name}</td>

                          <td>{lead.phone}</td>

                          <td>{lead.email}</td>

                          <td>
                            {roofSize?.displayValue || '-'}
                          </td>

                          <td>
                            {material?.displayValue || '-'}
                          </td>

                          <td>
                            {lead.estimate ? (
                              <>
                                $
                                {lead.estimate.low.toLocaleString()}
                                {' – '}
                                $
                                {lead.estimate.high.toLocaleString()}
                              </>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td>
                            <span className="status-badge">
                              {lead.status || 'new'}
                            </span>
                          </td>
                          <td>
                            {lead.createdAt
                              ? new Date(lead.createdAt).toLocaleDateString()
                              : '-'}
                          </td>

                        </tr>
                      )
                    })}

                  </tbody>

                </table>

              </div>
            )}

          </div>
        </>
      )}

      {activeTab === 'questions' && (
        <div className="questions-panel">
          <div className="questions-panel-header">
            <div>
              <h2>Estimator Questions</h2>
              <p>Controls what appears on the public estimator — changes are live immediately, no redeploy.</p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditingQuestionKey(null)
                setShowQuestionForm(true)
              }}
              disabled={!config}
            >
              + Add Question
            </button>
          </div>

          {configError && <p className="validation-error">{configError}</p>}
          {configMessage && <p className="config-message">{configMessage}</p>}

          {configLoading ? (
            <p>Loading questions...</p>
          ) : !config ? (
            <p>No configuration found.</p>
          ) : (
            <div className="question-list">
              {sortedQuestions.map((question, index) => (
                <div key={question.key} className="question-row">
                  <div className="question-row-order">
                    <button
                      type="button"
                      onClick={() => moveQuestion(question.key, 'up')}
                      disabled={index === 0 || configSaving}
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(question.key, 'down')}
                      disabled={index === sortedQuestions.length - 1 || configSaving}
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="question-row-info">
                    <p className="question-row-label">{question.label}</p>
                    <p className="question-row-meta">
                      {question.type === 'number' ? 'Number' : 'Multiple choice'} · key: {question.key}
                      {question.type === 'select' &&
                        ` · ${question.options?.length || 0} option${question.options?.length === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={question.active}
                      onChange={() => toggleQuestionActive(question.key)}
                      disabled={configSaving}
                    />
                    <span className="toggle-slider" />
                  </label>

                  <span
                    className={
                      question.active
                        ? 'question-status-badge is-on'
                        : 'question-status-badge is-off'
                    }
                  >
                    {question.active ? 'ON' : 'OFF'}
                  </span>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingQuestionKey(question.key)
                      setShowQuestionForm(true)
                    }}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showQuestionForm && config && (
        <QuestionFormModal
          question={config.questions.find((q) => q.key === editingQuestionKey) || null}
          existingKeys={config.questions.map((q) => q.key)}
          saving={configSaving}
          onCancel={() => {
            setShowQuestionForm(false)
            setEditingQuestionKey(null)
          }}
          onSave={upsertQuestion}
        />
      )}

    </div>
  )
}

export default Owner
