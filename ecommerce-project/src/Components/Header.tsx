import type { FormEvent } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import CartIcon from '../assets/images/icons/cart-icon.png';
import SearchIcon from '../assets/images/icons/search-icon.png';
import LogoWhite from '../assets/images/icons/logo-white.png';
import MobileLogoWhite from '../assets/images/icons/mobile-logo-white.png';
import './header.css';

type HeaderProps = {
    cart?: {
        productId: string;
        quantity: number;
        deliveryOptionId: string;
    }[];
};


export function Header({ cart = [] }: HeaderProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentSearch = searchParams.get('search') ?? '';

    let totalQuantity = 0;

    cart.forEach((cartItem) =>{
        totalQuantity += cartItem.quantity;
    });

    const search = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const text = String(new FormData(event.currentTarget).get('search') ?? '').trim();
        navigate(text ? `/?search=${encodeURIComponent(text)}` : '/');
    };
    return (
        <div className="header">
            <div className="left-section">
                <NavLink to="/" className="header-link">
                    <img className="logo"
                        src={LogoWhite} />
                    <img className="mobile-logo"
                        src= {MobileLogoWhite} />
                </NavLink>
            </div>

            <form className="middle-section" role="search" onSubmit={search}>
                {/* Keyed on the URL so the box follows the current search (e.g. after clicking the logo). */}
                <input key={currentSearch} className="search-bar" type="search" name="search"
                    placeholder="Search" aria-label="Search products" defaultValue={currentSearch} />

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