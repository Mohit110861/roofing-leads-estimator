import { useEffect, useState } from 'react'
import './App.css'
import Owner from "./owner";

function PublicEstimator() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [validationError, setValidationError] = useState('')

  const [contact, setContact] = useState({
    name: '',
    phone: '',
    email: '',
  })

  const [contactError, setContactError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [estimate, setEstimate] = useState(null)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetch('https://roofing-leads-estimator.onrender.com/api/config/public')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load configuration')
        }

        return res.json()
      })
      .then((data) => {
        setConfig(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setError('Unable to load estimator. Please try again.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <h2>Loading estimator...</h2>
  }

  if (error) {
    return <h2>{error}</h2>
  }

  const questions = config.questions
  const isContactStep = step === questions.length
  const currentQuestion = questions[step]

  function handleAnswer(value) {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.key]: value,
    }))

    setValidationError('')
  }

  function validateCurrentQuestion() {
    const value = answers[currentQuestion.key]

    if (
      currentQuestion.required &&
      (value === undefined || value === '')
    ) {
      setValidationError('This field is required.')
      return false
    }

    if (currentQuestion.type === 'number' && value !== '') {
      const numberValue = Number(value)

      if (Number.isNaN(numberValue)) {
        setValidationError('Please enter a valid number.')
        return false
      }

      if (
        currentQuestion.min !== undefined &&
        numberValue < currentQuestion.min
      ) {
        setValidationError(
          `Minimum value is ${currentQuestion.min} ${
            currentQuestion.unit || ''
          }`
        )
        return false
      }

      if (
        currentQuestion.max !== undefined &&
        numberValue > currentQuestion.max
      ) {
        setValidationError(
          `Maximum value is ${currentQuestion.max} ${
            currentQuestion.unit || ''
          }`
        )
        return false
      }
    }

    return true
  }

  function validateContact() {
    if (!contact.name.trim()) {
      setContactError('Please enter your name.')
      return false
    }

    if (!contact.phone.trim()) {
      setContactError('Please enter your phone number.')
      return false
    }

    if (!contact.email.trim()) {
      setContactError('Please enter your email address.')
      return false
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(contact.email)) {
      setContactError('Please enter a valid email address.')
      return false
    }

    return true
  }

  function handleContactChange(field, value) {
    setContact((previous) => ({
      ...previous,
      [field]: value,
    }))

    setContactError('')
  }

 async function handleNext() {
  if (isContactStep) {
    if (!validateContact()) {
      return
    }

    setContactError('')
    setSubmitError('')
    setSubmitting(true)

    try {
      const response = await fetch('https://roofing-leads-estimator.onrender.com/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          answers,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit lead')
      }

      setEstimate(data.estimate)
    } catch (err) {
      console.error(err)
      setSubmitError(
        err.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }

    return
  }

  if (!validateCurrentQuestion()) {
    return
  }

  setValidationError('')

  if (step < questions.length) {
    setStep(step + 1)
  }
}


  function handleBack() {
    setValidationError('')
    setContactError('')

    if (step > 0) {
      setStep(step - 1)
    }
  }

 const totalSteps = questions.length + 1
const progress = Math.round(((step + 1) / totalSteps) * 100)

if (estimate) {
  return (
    <div className="estimator">
      <div className="estimator-card result-card">

        <p className="company-name">
          {config.company.name}
        </p>

        <p className="location">
          {config.company.city}, {config.company.state}
        </p>

        <div className="result-content">

          <p className="result-label">
            Your Estimated Roof Cost
          </p>

          <h1 className="estimate-range">
            ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
          </h1>

          <p className="result-description">
            Thank you, {contact.name}! Your estimate has been calculated
            based on the information you provided.
          </p>

          <div className="result-details">

            <div>
              <span>Estimated Low</span>
              <strong>
                ${estimate.low.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Estimated High</span>
              <strong>
                ${estimate.high.toLocaleString()}
              </strong>
            </div>

          </div>

          <p className="result-note">
            This is an estimate and the final project cost may vary
            after an on-site inspection.
          </p>
          <button
  type="button"
  className="restart-button"
  onClick={() => {
    setEstimate(null)
    setStep(0)
    setAnswers({})
    setContact({
      name: '',
      phone: '',
      email: '',
    })
    setValidationError('')
    setContactError('')
    setSubmitError('')
  }}
>
  Start New Estimate
</button>

        </div>

      </div>
    </div>
  )
}

return (
    <div className="estimator">
      <div className="estimator-card">

        <p className="company-name">
          {config.company.name}
        </p>

        <p className="location">
          {config.company.city}, {config.company.state}
        </p>

        <h1>Roof Cost Estimator</h1>

        <div className="progress-info">
          <span>
            Step {step + 1} of {totalSteps}
          </span>

          <span>{progress}%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {!isContactStep ? (
          <>
            <div className="question-container">

              <label className="question-label">
                {currentQuestion.label}
              </label>

              {currentQuestion.type === 'number' && (
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={answers[currentQuestion.key] || ''}
                    min={currentQuestion.min}
                    max={currentQuestion.max}
                    onChange={(event) =>
                      handleAnswer(event.target.value)
                    }
                    placeholder="Enter value"
                  />

                  {currentQuestion.unit && (
                    <span>{currentQuestion.unit}</span>
                  )}
                </div>
              )}

              {currentQuestion.type === 'select' && (
                <div className="options">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={
                        answers[currentQuestion.key] === option.key
                          ? 'option selected'
                          : 'option'
                      }
                      onClick={() => handleAnswer(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}

              {validationError && (
                <p className="validation-error">
                  {validationError}
                </p>
              )}

            </div>
          </>
        ) : (
          <div className="contact-container">

            <h2>Almost there!</h2>

            <p>
              Enter your contact information to receive your roof estimate.
            </p>

            <div className="contact-field">
              <label>Name</label>

              <input
                type="text"
                value={contact.name}
                onChange={(event) =>
                  handleContactChange('name', event.target.value)
                }
                placeholder="Your name"
              />
            </div>

            <div className="contact-field">
              <label>Phone</label>

              <input
                type="tel"
                value={contact.phone}
                onChange={(event) =>
                  handleContactChange('phone', event.target.value)
                }
                placeholder="Your phone number"
              />
            </div>

            <div className="contact-field">
              <label>Email</label>

              <input
                type="email"
                value={contact.email}
                onChange={(event) =>
                  handleContactChange('email', event.target.value)
                }
                placeholder="you@example.com"
              />
            </div>

            {contactError && (
              <p className="validation-error">
                {contactError}
              </p>
            )}

            {submitError && (
  <p className="validation-error">
    {submitError}
  </p>
)}

          </div>
        )}

        <div className="navigation">

          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
          >
            {isContactStep
  ? submitting
    ? 'Calculating...'
    : 'Get Estimate'
  : 'Next'}
          </button>

        </div>

      </div>
    </div>
  )
}


function App() {
  if (window.location.pathname === '/owner') {
    return <Owner />
  }

  return <PublicEstimator />
}

export default App