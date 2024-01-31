const { axiosObservable, getErrorCode } = require("../config/helpers");

exports.uploadFile = async (req, res) => {
  try {
    const { file_url } = req.body;
    let responseUploadFile = await axiosObservable({
      data: {
        file_url: file_url,
      },
      headers: {
        "Content-Type": "application/json",
      },
      method: "post",
      url: "http://10.240.65.9:5090/upload",
      _requestid: req._requestid,
    });

    if (responseUploadFile.data && responseUploadFile.statusText === "OK") {
      return res.json(responseUploadFile.data);
    }
    return res.status(400).json(getErrorCode(errors.UNEXPECTED_ERROR));
  } catch (exception) {
    return res
      .status(500)
      .json(
        getErrorCode(
          null,
          exception,
          `Request to ${req.originalUrl}`,
          req._requestid
        )
      );
  }
};
