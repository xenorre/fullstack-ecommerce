import Product from "../models/product.model.js";

export const getCartItems = async (req, res) => {
  try {
    const products = await Product.find({ _id: { $in: req.user.cartItems } });

    const cartItems = products.map((product) => {
      const item = req.user.cartItems.find((item) => item.id === product._id);
      return {
        ...product.toJSON(),
        quantity: item.quantity,
      };
    });

    res.status(200).json({
      message: "Cart items retrieved successfully",
      products: cartItems,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving cart items", error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push(productId);
    }

    await user.save();

    res.status(200).json({
      items: user.cartItems,
      message: "Item added to cart successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding item to cart", error: error.message });
  }
};

export const removeAllFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = req.user;

    if (!productId) {
      user.cartItems = [];
    } else {
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    }
    await user.save();
    res.status(200).json({
      items: user.cartItems,
      message: "All items removed from cart successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing items from cart",
      error: error.message,
    });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { quantity } = req.body;
    const user = req.user;

    const existingItem = user.cartItems.find((item) => item.id === productId);

    if (existingItem) {
      if (quantity === 0) {
        user.cartItems = user.cartItems.filter((item) => item.id !== productId);
      } else {
        existingItem.quantity = quantity;
      }
      await user.save();
      return res.status(200).json({
        message: `Quantity for item ${productId} updated successfully`,
      });
    } else {
      return res.status(404).json({
        message: `Item with ID ${productId} not found in cart`,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating item quantity", error: error.message });
  }
};
