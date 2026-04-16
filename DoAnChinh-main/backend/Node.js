app.post("/api/orders", async (req, res) => {
    try {
      const { items } = req.body;
  
      // lưu đơn hàng (MongoDB)
      const newOrder = new Order({
        items,
        total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      });
  
      await newOrder.save();
  
      // xoá giỏ hàng
      await Cart.deleteMany({});
  
      res.json({ message: "Order created" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });