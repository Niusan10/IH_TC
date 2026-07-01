import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [email, setEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [message, setMessage] = useState('Entra con tu email para ver la demo interna.')

  useEffect(() => {
    const storedEmail = window.localStorage.getItem('ih-tc-email')
    if (storedEmail) {
      setEmail(storedEmail)
      setIsAuthenticated(true)
      setMessage(`Bienvenido, ${storedEmail}`)
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

      <main className="hero-block">
        <section className="hero-copy">
          <p className="eyebrow">Instalaciones simples y profesionales</p>
          <h1>La APP de instalaciones para el más tonto de la isla</h1>
          <p className="lead">
            Gestiona pedidos, visitas y entregas desde un solo lugar con un proceso claro para cada instalación de césped artificial.
          </p>
          <div className="actions">
            <a href="#acceso" className="btn btn-primary">
              Entrar con email
            </a>
          </div>
        </section>

        <section className="hero-media">
          <img
            src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80"
            alt="Zona exterior con césped artificial verde"
          />
        </section>
      </main>

      <section className="access-card" id="acceso">
        {!isAuthenticated ? (
          <>
            <h2>Accede a la demo</h2>
            <p>Introduce tu email para entrar al panel interno.</p>
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
    </div>
  )
}

export default App
