import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { cartQuery } from '../api';
import CartIcon from '../assets/images/icons/cart-icon.png';
import SearchIcon from '../assets/images/icons/search-icon.png';
import LogoWhite from '../assets/images/icons/logo-white.png';
import MobileLogoWhite from '../assets/images/icons/mobile-logo-white.png';
import './Header.css';

/** How long to wait after the last keystroke before searching. */
export const SEARCH_DELAY_MS = 300;

export function Header() {
    const navigate = useNavigate();
    const onHomePage = useLocation().pathname === '/';
    const [searchParams, setSearchParams] = useSearchParams();
    const currentSearch = searchParams.get('search') ?? '';
    // Shares the cached cart with every other component that uses it.
    const { data: cart = [] } = useQuery(cartQuery);

    const totalQuantity = cart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

    // What's typed in the box. It follows the URL when the search changes some
    // other way (the logo, the back button), but not when it only differs by
    // spaces we trimmed off, or a half-typed "socks " would lose its space.
    const [text, setText] = useState(currentSearch);
    const [searchShown, setSearchShown] = useState(currentSearch);
    if (currentSearch !== searchShown) {
        setSearchShown(currentSearch);
        if (currentSearch !== text.trim()) setText(currentSearch);
    }

    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(searchTimer.current), []);

    const searchFor = (value: string, replace: boolean) => {
        const term = value.trim();
        if (!onHomePage) {
            navigate(term ? `/?search=${encodeURIComponent(term)}` : '/');
        } else if (term !== currentSearch) {
            // Keep the sort order and rating filter.
            setSearchParams((current) => {
                const next = new URLSearchParams(current);
                if (term) next.set('search', term);
                else next.delete('search');
                return next;
            }, { replace });
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setText(value);
        // On the home page, results update as you type. Elsewhere, press Enter.
        if (!onHomePage) return;
        clearTimeout(searchTimer.current);
        // `replace` so each pause in typing doesn't add a Back-button step.
        searchTimer.current = setTimeout(() => searchFor(value, true), SEARCH_DELAY_MS);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        clearTimeout(searchTimer.current);
        searchFor(text, false);
    };

    return (
        <div className="header">
            <div className="left-section">
                <NavLink to="/" className="header-link">
                    <img className="logo"
                        src={LogoWhite} />
                    <img className="mobile-logo"
                        src={MobileLogoWhite} />
                </NavLink>
            </div>

            <form className="middle-section" role="search" onSubmit={handleSubmit}>
                <input className="search-bar" type="search" name="search"
                    placeholder="Search" aria-label="Search products"
                    value={text} onChange={handleChange} />

                <button className="search-button" type="submit" aria-label="Search">
                    <img className="search-icon" src={SearchIcon} alt="" />
                </button>
            </form>

            <div className="right-section">
                <NavLink className="orders-link header-link" to="/orders">
                    <span className="orders-text">Orders</span>
                </NavLink>

                <NavLink className="cart-link header-link" to="/checkout">
                    <img className="cart-icon" src={CartIcon} />
                    <div className="cart-quantity">{totalQuantity}</div>
                    <div className="cart-text">Cart</div>
                </NavLink>
            </div>
        </div>
    );
}