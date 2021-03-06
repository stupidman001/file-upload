const inspect = require('util').inspect
const path = require('path')
const fs = require('fs')
const Busboy = require('busboy')

/**
 * 同步创建文件目录
 * @param  {string} dirname 目录绝对地址  D:\qiangyujun\Desktop\KOA\upload-files\album
 * @return {boolean}        创建目录结果
 */
function mkdirsSync( dirname ) {
  // 存储文件的文件夹存在了，返回 true
  if (fs.existsSync( dirname )) {
    return true
  } else {
  //  存储文件的文件夹不存在，创建文件夹
    if (mkdirsSync(path.dirname(dirname)) ) {
      fs.mkdirSync( dirname )
      return true
    }
  }
}

/**
 * 获取上传文件的后缀名
 * @param  {string} fileName 获取上传文件的后缀名
 * @return {string}          文件后缀名
 */
function getSuffixName( fileName ) {
  let nameList = fileName.split('.')
  return nameList[nameList.length - 1]
}

/**
 * 上传文件
 * @param  {object} ctx     koa上下文
 * @param  {object} options 文件上传参数 fileType文件类型， path文件存放路径
 * @return {promise}         
 */
function uploadFile( ctx, options) {
  // 请求和响应
  let req = ctx.req
  let res = ctx.res

  let busboy = new Busboy({headers: req.headers})

  // 获取类型
  let fileType = options.fileType || 'common'
  console.log('存储的位置' + options.path)           // D:\qiangyujun\Desktop\KOA\upload-files
  console.log('文件类型' + fileType)                 // album
  let filePath = path.join(options.path,  fileType) // D:\qiangyujun\Desktop\KOA\upload-files\album
  let mkdirResult = mkdirsSync( filePath )
  // 现在存储文件的文件夹创建好了
  
  return new Promise((resolve, reject) => {
    console.log('文件上传中...')
    let result = { 
      success: false,
      formData: {},
    }

    // 解析请求文件事件
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      let fileName = Math.random().toString(16).substr(2) + '.' + getSuffixName(filename)
      let _uploadFilePath = path.join( filePath, fileName )
      let saveTo = path.join(_uploadFilePath)

      // 文件保存到制定路径
      file.pipe(fs.createWriteStream(saveTo))

      // 文件写入事件结束
      file.on('end', function() {
        result.success = true
        result.message = '文件上传成功'
        console.log('文件上传成功！')
      })
    })

    // 解析表单中其他字段信息
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      console.log('表单字段数据 [' + fieldname + ']: value: ' + inspect(val));
      result.formData[fieldname] = inspect(val);
    });

    // 解析结束事件
    busboy.on('finish', function( ) {
      console.log('文件上结束')
      resolve(result)
    })

    // 解析错误事件
    busboy.on('error', function(err) {
      console.log('文件上出错')
      reject(result)
    })
    req.pipe(busboy)
  })
} 

module.exports =  {
  uploadFile
}