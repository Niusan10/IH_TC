import { useEffect, useState } from 'react'
import './App.css'

const benefits = [
  {
    title: 'Instalaciones rápidas',
    text: 'Ponemos en marcha jardines, terrazas y zonas infantiles con tiempos de ejecución muy cortos.',
  },
  {
    title: 'Acabados premium',
    text: 'Materiales resistentes al sol, al agua y al uso diario para un resultado impecable.',
  },
  {
    title: 'Control total del proyecto',
    text: 'Gestiona presupuestos, visitas, fechas y entregas desde una sola plataforma.',
  },
]

const steps = ['Consulta inicial', 'Medición y diseño', 'Instalación', 'Entrega final']

function App() {
  const [email, setEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [message, setMessage] = useState('Accede con tu correo para entrar a la demo interna.')

  useEffect(() => {
    const storedEmail = window.localStorage.getItem('ih-tc-email')
    if (storedEmail) {
      setEmail(storedEmail)
      setIsAuthenticated(true)
      setMessage(`Bienvenido de nuevo, ${storedEmail}`)
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage('Introduce un correo válido para entrar.')
      return
    }

    window.localStorage.setItem('ih-tc-email', normalizedEmail)
    setIsAuthenticated(true)
    setMessage(`Acceso permitido para ${normalizedEmail}`)
  }

  const handleLogout = () => {
    window.localStorage.removeItem('ih-tc-email')
    setEmail('')
    setIsAuthenticated(false)
    setMessage('Sesión cerrada. Puedes entrar otra vez con tu email.')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">IH_TC</div>
        <div className="pill">Césped artificial • Instalaciones</div>
      </header>

      <main className="hero-grid">
        <section className="hero-copy">
          <p className="eyebrow">Instalaciones sin complicaciones</p>
          <h1>La APP de isntalaciones para el más tonto de la isla</h1>
          <p className="lead">
            Gestiona presupuestos, visitas, pedidos y entregas para proyectos de césped artificial con una experiencia rápida y clara.
          </p>

          <div className="actions">
            <a href="#acceso" className="btn btn-primary">
              Entrar con email
            </a>
            <a href="#beneficios" className="btn btn-secondary">
              Ver beneficios
            </a>
          </div>

          <ul className="bullet-list">
            <li>Diseños realistas y duraderos</li>
            <li>Instalaciones en pocos días</li>
            <li>Soporte y seguimiento continuo</li>
          </ul>
        </section>

        <section className="auth-card" id="acceso">
          {!isAuthenticated ? (
            <>
              <h2>Accede a la demo</h2>
              <p>Introduce tu email para entrar al panel interno de operaciones.</p>
              <form onSubmit={handleSubmit} className="auth-form">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@email.com"
                  required
                />
                <button type="submit">Entrar</button>
              </form>
              <p className="status">{message}</p>
            </>
          ) : (
            <>
              <h2>Panel listo</h2>
              <p>Tu acceso está activado para {email}.</p>
              <div className="dashboard-card">
                <span>📍 12 proyectos activos</span>
                <span>🌿 4 instalaciones esta semana</span>
                <span>✅ 98% de satisfacción</span>
              </div>
              <button type="button" className="btn btn-secondary full-width" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          )}
        </section>
      </main>

      <section className="feature-section" id="beneficios">
        <div className="section-title">
          <p className="eyebrow">Por qué elegirnos</p>
          <h2>Una app pensada para vender, instalar y cuidar cada proyecto.</h2>
        </div>

        <div className="cards">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="info-card">
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="steps-section">
        <div className="section-title">
          <p className="eyebrow">Cómo funciona</p>
          <h2>Un proceso simple desde el primer contacto hasta la entrega.</h2>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div key={step} className="step-item">
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
