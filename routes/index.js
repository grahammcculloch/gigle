var express = require('express');
var router = express.Router();


/* The single page in our Single Page App!
 *
 */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Gigle' });
});

module.exports = router;
