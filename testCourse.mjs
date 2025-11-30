fetch('http://localhost:5000/api/courses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Test Course',
    subtitle: 'Test Subtitle',
    category: 'web',
    description: 'Test Description',
    price: 999,
    discountPercent: 10,
    gstPercent: 18
  })
}).then(res => res.json()).then(console.log).catch(console.error);