const express = require('express');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to Tiki Scraper API');
});

const getPage = async (url) => {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  await page.goto(url);
  await autoScroll(page);
  const html = await page.content(); // serialized HTML of page DOM.
  await browser.close();
  return html;
};

const getWithoutScrollingPage = async (url) => {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  await page.goto(url);
  const html = await page.content(); // serialized HTML of page DOM.
  await browser.close();
  return html;
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// GET product details by id

app.get('/products/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const url = `https://www.tiki.vn/p/${productId}`;

    const html = await getPage(url);
    const $ = cheerio.load(html);

    const title = $('h1.title').text();
    const thumbnails = $('.fWjUGo').attr('src');
    const brand = $('.brand-and-author > h6 > a').text();
    const currentPrice = $('.product-price__current-price').text();
    const listPrice = $('.product-price__list-price').text();
    const discount = $('.product-price__discount-rate').text();
    const tableRows = $('.content.has-table > table > tbody > tr');
    const content = $('.content').not('.has-table').first().text();
    const contentImage = $('.content > div > div > p > img').attr('src');
    const ratingPoints = $('.review-rating__point').text();
    const ratingTotal = $('.review-rating__total').text().split(' ')[0];

    let properties = [];
    tableRows.each((index, row) => {
      const key = $(row.children[0]).text();
      const value = $(row.children[1]).text();
      properties.push({
        property: key,
        detail: value,
      });
    });

    res.json({
      title,
      url,
      brand,
      price: { currentPrice, listPrice, discount },
      thumbnails,
      properties,
      description: { content, contentImage },
      reviews: { ratingPoints, ratingTotal },
    });
  } catch (error) {
    res.json(error);
  }
});

// GET coupons information

app.get('/coupons', async (req, res) => {
  const url = 'https://tiki.vn/khuyen-mai/ma-giam-gia';
  try {
    const html = await getPage(url);
    const $ = cheerio.load(html);
    const coupons = [];
    const couponTypes = $('div').find('[data-brick-type="COUPON"]');
    couponTypes.each((index, coupon) => {
      const couponLabel = $(coupon).data('brick-label');
      let couponList = [];
      const couponItems = $(coupon).find('.coupon-item');
      couponItems.each((index, item) => {
        const innerDiv = $(item).find('div > div');
        const couponFrom = $(innerDiv).children('.cKclwG').first().text();
        const couponRate = $(innerDiv).find('h4').text();
        const couponRange = $(innerDiv).children('p:nth-child(2)').text();
        const couponExpiry = $(innerDiv)
          .children('p')
          .last()
          .text()
          .split(' ')[1];
        const couponCode = $('.cYXwxT').data('view-label');
        couponList.push({
          couponFrom,
          couponCode,
          couponExpiry,
          couponRate,
          couponRange,
        });
      });
      coupons.push({
        couponLabel,
        couponList
      });
    });
    res.json(coupons);
  } catch (error) {
    res.json(error);
  }
});

// GET products list from search query

app.get('/search', async (req, res) => {
  const {
    q,
    page,
    stock_location,
    rating,
    price,
    brand,
    sort,
  } = req.query;
  const url = `https://www.tiki.vn/search?q=${encodeURI(q)}${
    stock_location ? `&stock_location=${stock_location}` : ''
  }${page ? `&page=${page}` : ''}${sort ? `&sort=${sort}` : ''}${rating ? `&rating=${rating}` : ''}${price ? `&price=${price}` : ''}${
    brand ? `&brand=${brand}` : ''
  }`;
  try {
    const html = await getPage(url);
    const $ = cheerio.load(html);

    const productItems = $('.product-item');

    let products = [];
    productItems.each((index, product) => {
      const url = $(product).attr('href');
      let thumbnails = $(product).find('.fWjUGo').attr('src');
      const name = $(product).find('.name').text();
      const price = $(product).find('.price-discount__price').text();
      const discount = $(product).find('.price-discount__discount').text();

      products.push({
        name,
        url,
        thumbnails,
        pricing: { price, discount },
      });
    });
    res.json(products);
  } catch (err) {
    res.json(err);
  }
});

// GET product categories

app.get('/categories', async (req, res) => {
  const url = 'https://www.tiki.vn';
  try {
    const html = await getWithoutScrollingPage(url);
    const $ = cheerio.load(html);
    let categories = [];
    const listItem = $('.styles__StyledListItem-sc-w7gnxl-0.cjqkgR').not('.highlight-block').find('a');
    listItem.each((index, item) => {
      const link = $(item).attr('href');
      const category = link.replace('https://tiki.vn/', '');
      const title = $(item).attr('title');
      categories.push({
        link,
        category,
        title
      })
    })
    res.json(categories);
  } catch (error) {
    res.json(error);
  }
});

// GET products list by category

app.get('/category/:category/:code', async (req, res) => {
  const {
    page,
    stock_location,
    rating,
    price,
    brand,
    sort,
  } = req.query;
  const { category, code } = req.params;
  const url = `https://www.tiki.vn/${category + '/' + code}?${
    stock_location ? `&stock_location=${stock_location}` : ''
  }${page ? `&page=${page}` : ''}${sort ? `&sort=${sort}` : ''}${rating ? `&rating=${rating}` : ''}${price ? `&price=${price}` : ''}${
    brand ? `&brand=${brand}` : ''
  }`;
  try {
    const html = await getPage(url);
    const $ = cheerio.load(html);

    const productItems = $('.product-item');

    let products = [];
    productItems.each((index, product) => {
      const url = $(product).attr('href');
      let thumbnails = $(product).find('.fWjUGo').attr('src');
      const name = $(product).find('.name').text();
      const price = $(product).find('.price-discount__price').text();
      const discount = $(product).find('.price-discount__discount').text();

      products.push({
        name,
        url,
        thumbnails,
        pricing: { price, discount },
      });
    });
    res.json(products);
  } catch (err) {
    res.json(err);
  }
});

app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});
