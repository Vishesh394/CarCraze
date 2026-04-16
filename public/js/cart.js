(function () {
  const cartKey = "carCrazeCart";

  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch (error) {
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  };

  const getCartCount = (cart) => {
    return cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  };

  const getCartTotal = (cart) => {
    return cart.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
  };

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const renderCartItems = (cart) => {
    const containers = document.querySelectorAll("[data-cart-items]");

    containers.forEach((container) => {
      if (!cart.length) {
        container.innerHTML = '<p class="small mb-0">Your cart is empty. Add accessories to see them here.</p>';
        return;
      }

      container.innerHTML = cart
        .map(
          (item) => `
            <div class="cart-line-item">
              <div>
                <strong>${item.name}</strong>
                <span class="small d-block">${item.category || "Accessory"} | Rs ${formatPrice(item.price)}</span>
              </div>
              <div class="cart-line-actions">
                <button class="cart-qty-btn" type="button" data-cart-decrease="${item.id}" aria-label="Decrease ${item.name}">-</button>
                <span>${item.quantity}</span>
                <button class="cart-qty-btn" type="button" data-cart-increase="${item.id}" aria-label="Increase ${item.name}">+</button>
                <button class="cart-remove-btn" type="button" data-cart-remove="${item.id}">Remove</button>
              </div>
            </div>
          `
        )
        .join("");
    });
  };

  const updateCartUi = () => {
    const cart = getCart();
    const count = getCartCount(cart);
    const total = getCartTotal(cart);

    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = count;
    });

    document.querySelectorAll("[data-cart-total]").forEach((element) => {
      element.textContent = formatPrice(total);
    });

    renderCartItems(cart);
  };

  const setCartMessage = (message) => {
    document.querySelectorAll("[data-cart-message]").forEach((element) => {
      element.textContent = message;
    });
  };

  const showAddedState = (button) => {
    const originalText = button.textContent;
    button.textContent = "Added";
    button.disabled = true;

    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 900);
  };

  const addToCart = (button) => {
    const product = {
      id: button.dataset.id,
      name: button.dataset.name,
      price: Number(button.dataset.price),
      image: button.dataset.image,
      category: button.dataset.category
    };

    if (!product.id) {
      return;
    }

    const cart = getCart();
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    updateCartUi();
    setCartMessage(`${product.name} added to cart.`);
    showAddedState(button);
  };

  const changeQuantity = (productId, amount) => {
    const cart = getCart()
      .map((item) => {
        if (item.id === productId) {
          return { ...item, quantity: Number(item.quantity || 0) + amount };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    saveCart(cart);
    updateCartUi();
  };

  const removeFromCart = (productId) => {
    const cart = getCart().filter((item) => item.id !== productId);
    saveCart(cart);
    updateCartUi();
  };

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-to-cart]");
    const clearButton = event.target.closest("[data-clear-cart]");
    const checkoutButton = event.target.closest("[data-cart-checkout]");
    const increaseButton = event.target.closest("[data-cart-increase]");
    const decreaseButton = event.target.closest("[data-cart-decrease]");
    const removeButton = event.target.closest("[data-cart-remove]");

    if (addButton) {
      addToCart(addButton);
    }

    if (increaseButton) {
      changeQuantity(increaseButton.dataset.cartIncrease, 1);
      setCartMessage("");
    }

    if (decreaseButton) {
      changeQuantity(decreaseButton.dataset.cartDecrease, -1);
      setCartMessage("");
    }

    if (removeButton) {
      removeFromCart(removeButton.dataset.cartRemove);
      setCartMessage("Item removed from cart.");
    }

    if (clearButton) {
      saveCart([]);
      updateCartUi();
      setCartMessage("Cart cleared.");
    }

    if (checkoutButton) {
      const cart = getCart();
      setCartMessage(
        cart.length
          ? "Checkout is ready for future order and payment integration."
          : "Add at least one accessory before checkout."
      );
    }
  });

  updateCartUi();
})();
