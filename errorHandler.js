'use strict';
// 错误路由处理
// Todo：错误代码
module.exports = (err, req, res, next) => {
  if (err && err.code !== 200) {
    console.log(err);
    res.json(err);
  } else {
    res.json({
      code: 200,
      msg: "OK"
    });
  }
}
