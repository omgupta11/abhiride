
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  ArrowUpRight,
  Menu,
  X,
} from 'lucide-react'

import Logo from '../components/common/Logo'

interface MainLayoutProps {
  children: ReactNode
  showFooter?: boolean
}

const MainLayout = ({
  children,
  showFooter = true,
}: MainLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-[#edf0ed] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="AbhiRide home" onClick={closeMobileMenu}>
            <Logo />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#087f5b]'
                    : 'text-[#68736d] hover:text-[#151a18]'
                }`
              }
            >
              Find a ride
            </NavLink>

            <a href="/#how-it-works" className="text-sm font-medium text-[#68736d] hover:text-[#151a18]">
              How it works
            </a>

            <a href="/#why-abhiride" className="text-sm font-medium text-[#68736d] hover:text-[#151a18]">
              Why AbhiRide
            </a>
          </nav>

          <Link
            to="/drivers"
            className="hidden min-h-10 items-center gap-2 rounded-xl bg-[#087f5b] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#066b4d] md:inline-flex"
          >
            Drive with us
            <ArrowUpRight size={15} />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8ece9] text-[#151a18] hover:bg-[#f5f8f6] md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav aria-label="Mobile navigation" className="border-t border-[#edf0ed] bg-white px-5 py-4 md:hidden">
            <div className="mx-auto flex max-w-[1200px] flex-col gap-1">
              <Link to="/" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 text-sm font-medium text-[#454d49] hover:bg-[#f3faf6]">
                Find a ride
              </Link>

              <a href="/#how-it-works" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 text-sm font-medium text-[#454d49] hover:bg-[#f3faf6]">
                How it works
              </a>

              <a href="/#why-abhiride" onClick={closeMobileMenu} className="rounded-lg px-3 py-3 text-sm font-medium text-[#454d49] hover:bg-[#f3faf6]">
                Why AbhiRide
              </a>

              <Link to="/drivers" onClick={closeMobileMenu} className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087f5b] px-4 text-sm font-semibold text-white">
                Drive with us
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {showFooter && (
        <footer className="border-t border-[#e8ece9] bg-[#fafbfa]">
          <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <Link to="/" aria-label="AbhiRide home">
                  <Logo />
                </Link>

                <p className="mt-4 max-w-sm text-sm leading-7 text-[#68736d]">
                  Discover nearby autos, taxis and bikes. Connect directly
                  with local drivers and agree on your ride without platform
                  commissions.
                </p>

                <p className="mt-4 text-sm font-medium text-[#087f5b]">
                  YOUR RIDE. YOUR CHOICE.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#151a18]">Explore</h3>
                <ul className="mt-4 space-y-3 text-sm text-[#68736d]">
                  <li><Link to="/" className="hover:text-[#087f5b]">Find a ride</Link></li>
                  <li><a href="/#how-it-works" className="hover:text-[#087f5b]">How it works</a></li>
                  <li><a href="/#why-abhiride" className="hover:text-[#087f5b]">Why AbhiRide</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#151a18]">For drivers</h3>
                <ul className="mt-4 space-y-3 text-sm text-[#68736d]">
                  <li><Link to="/drivers" className="hover:text-[#087f5b]">Driver registration</Link></li>
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-[#e8ece9] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#818a85]">
                © {new Date().getFullYear()} AbhiRide. All rights reserved.
              </p>

              <p className="text-xs text-[#818a85]">
                Built for simpler local travel.
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default MainLayout
