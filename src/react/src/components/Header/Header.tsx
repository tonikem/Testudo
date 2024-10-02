import { Link } from "wouter"
import './style.css'
import logo from '../../../public/turtle.png'

function Header() {

    function onTitleClick(e: any) {
        e.preventDefault()
        window.location.pathname = "/"
    }

    function onMouseClick() {
        window.location.pathname = "/"
    }

    return (
        <div className="main-header">
            <nav className="navbar navbar-inverse">
                <div className="container-fluid">
                    <div className="navbar-header">
                        <a onClick={onTitleClick} id="title" className="navbar-brand" href="#">
                            <b>Testudo</b>
                        </a>
                    </div>
                    <ul className="nav navbar-nav">
                        <img src={logo}
                            alt="Logo"
                            className="main-logo"
                            onClick={onMouseClick} />

                        <li>
                            <Link href="/">Home</Link>
                        </li>
                        <li>
                            <Link href="/notebooks">Notebooks</Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    )
}


export default Header

