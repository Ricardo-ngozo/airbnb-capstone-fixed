const tapline = require('../services/taplineService');

function safeWrap(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

exports.locations = safeWrap(async (req, res) => {
  const q = req.query.q || req.query.query || req.query.term || '';
  const data = await tapline.locations(q);
  res.json(data);
});

exports.search = safeWrap(async (req, res) => {
  const body = req.body || {};
  const data = await tapline.search(body);
  res.json(data);
});

exports.details = safeWrap(async (req, res) => {
  const body = req.body || {};
  const data = await tapline.details(body);
  res.json(data);
});

exports.price = safeWrap(async (req, res) => {
  const body = req.body || {};
  const data = await tapline.price(body);
  res.json(data);
});

exports.calendar = safeWrap(async (req, res) => {
  const body = req.body || {};
  const data = await tapline.calendar(body);
  res.json(data);
});

exports.reviews = safeWrap(async (req, res) => {
  const body = req.body || {};
  const data = await tapline.reviews(body);
  res.json(data);
});
