const express = require("express");
const Checkout = require("../models/Checkout");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// @route POST /api/checkout
// @desc Create a new checkout session
// @access Private
// @route POST /api/checkout
// @desc Create a new checkout session
// @access Private
router.post("/", protect, async (req, res) => {
  const { checkoutItems, shippingAddress, paymentMethod } = req.body;

  if (
    !checkoutItems ||
    !Array.isArray(checkoutItems) ||
    checkoutItems.length === 0
  ) {
    return res.status(400).json({ message: "No items in checkout" });
  }

  try {
    // Create a new checkout session
    let totalPrice = 0;
    const validatedCheckoutItems = [];

    for (const item of checkoutItems) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.productId}` });
      }

      // Check stock
      if (product.countInStock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for product: ${product.name}` });
      }

      // Use server-side price
      const price = product.price; // Note: You might want to use discountPrice if applicable

      totalPrice += price * item.quantity;

      validatedCheckoutItems.push({
        productId: product._id,
        name: product.name,
        image: product.images[0]?.url || "",
        price: price,
        quantity: item.quantity,
        size: item.size || "",
        color: item.color || "",
      });
    }

    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItems: validatedCheckoutItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      paymentStatus: "Pending",
      isPaid: false,
    });

    // Update user's phone number if provided
    if (shippingAddress.phone) {
      await User.findByIdAndUpdate(req.user._id, {
        phone: shippingAddress.phone,
      });
      console.log(`Updated phone number for user: ${req.user._id}`);
    }

    console.log(`Checkout created for user: ${req.user._id}`);
    res.status(201).json(newCheckout);
  } catch (error) {
    console.error("Error Creating checkout session:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PUT /api/checkout/:id/pay
// @desc Update checkout to mark as paid after successful payment
// @access Private
router.put("/:id/pay", protect, async (req, res) => {
  const { paymentStatus, paymentDetails } = req.body;

  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (paymentStatus === "paid") {
      checkout.isPaid = true;
      checkout.paymentStatus = paymentStatus;
      checkout.paymentDetails = paymentDetails;
      checkout.paidAt = Date.now();
      await checkout.save();

      res.status(200).json(checkout);
    } else {
      res.status(400).json({ message: "Invalid Payment Status" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/checkout/:id/finalize
// @desc Finalize checkout and convert to an order after payment confirmation
// @access Private
router.post("/:id/finalize", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (checkout.isPaid && !checkout.isFinalized) {
      // 1. Verify Stock and prepare updates
      /* 
       Optimistic Locking or Transactions would be better here, 
       but for this implementation we will check all first then update.
      */
      for (const item of checkout.checkoutItems) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res
            .status(400)
            .json({ message: `Product not found: ${item.name}` });
        }
        if (product.countInStock < item.quantity) {
          return res
            .status(400)
            .json({ message: `Insufficient stock for: ${product.name}` });
        }
      }

      // 2. Decrement Stock
      for (const item of checkout.checkoutItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { countInStock: -item.quantity },
        });
      }

      try {
        // Create final order based on the checkout details
        const finalOrder = await Order.create({
          user: checkout.user,
          orderItems: checkout.checkoutItems,
          shippingAddress: checkout.shippingAddress,
          paymentMethod: checkout.paymentMethod,
          totalPrice: checkout.totalPrice,
          isPaid: true,
          paidAt: checkout.paidAt,
          isDelivered: false,
          paymentStatus: "paid",
        });

        // Mark the checkout as finalized
        checkout.isFinalized = true;
        checkout.finalizedAt = Date.now();
        await checkout.save();
        // Delete the cart associated with the user
        await Cart.findOneAndDelete({ user: checkout.user });
        res.status(201).json(finalOrder);
      } catch (error) {
        console.error("Error creating order, rolling back stock:", error);
        // Rollback stock decrement
        for (const item of checkout.checkoutItems) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { countInStock: item.quantity },
          });
        }
        throw error;
      }
    } else if (checkout.isFinalized) {
      res.status(400).json({ message: "Checkout already finalized" });
    } else {
      res.status(400).json({ message: "Checkout is not paid" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
