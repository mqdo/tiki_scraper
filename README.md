# TIKI SCRAPER API

This is a simple API for getting information of products in Tiki Trading Vietnam in a simple way. The API is a study case only and will not be using for commercial purposes.

Used Technologies: Node.js with Express.js, Cheerio.js and Puppeteer.js

This API consist of 5 endpoints:

## GET /products/:productId

Purpose: Get information of a product with a given product ID.

Request:

- params: productId

Response:

- json:

```JavaScript
{
  title,
  url,
  brand,
  price: { currentPrice, listPrice, discount },
  thumbnails,
  properties,
  description: { content, contentImage },
  reviews: { ratingPoints, ratingTotal }
}
```

Example of a product ID:
<https://tiki.vn/dien-thoai-samsung-galaxy-z-flip-4-8gb-128gb-hang-chinh-hang-p194034217.html>

**194034217** is the product ID

## GET /coupons

Purpose: Get a list of coupons available at the moment

Request: no parameters or queries required

Response:

- json:

```JavaScript
[
  couponLabel,
  [
    {
      couponFrom,
      couponCode,
      couponExpiry,
      couponRate,
      couponRange
    }
  ]
]
```

## GET /search

Purpose: Get products list from search query string

Request:

- query:
  - q: query string
  - optional:
    - page: number of the page
    - stock_location: stock location
    - rating: rating of the products
    - price: price of the products
    - brand: brand of the products
    - sort: default, top_seller, newest,...

Response:

```JavaScript
[
  {
    name,
    url,
    thumbnails,
    pricing: { price, discount }
  }
]
```

Example of search queries:  q=%C4%91i%E1%BB%87n+tho%E1%BA%A1i&sort=top_seller&stock_location=VN034&rating=4&price=2500000%2C6500000&brand=18802

## GET /categories

Purpose: Get categories list

Request: no parameters or queries required

Response:

```JavaScript
[
  {
    link,
    category,
    title
  }
]
```

## GET /category/:category/:code

Purpose: Get products of a category

Request:

- query (optional):
  - page: number of the page
  - stock_location: stock location
  - rating: rating of the products
  - price: price of the products
  - brand: brand of the products
  - sort: default, top_seller, newest,...
- params:
  - category
  - code

Response:

```JavaScript
[
  {
    name,
    url,
    thumbnails,
    pricing: { price, discount }
  }
]
```

Example of category: <https://tiki.vn/dien-thoai-may-tinh-bang/c1789>

**dien-thoai-may-tinh-bang** is the category name *(category)*, **c1789** is the category code *(code)*
