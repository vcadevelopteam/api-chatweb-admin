const { default: axios } = require("axios");
const { axiosObservable, getErrorCode } = require("../config/helpers");

exports.createThreads = async (req, res) => {
  try {
    const { apikey } = req.body;
    let responseThread = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/threads`,
      data: { apikey: apikey },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (responseThread.data && responseThread.statusText === "OK") {
      return res.json(responseThread.data);
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

exports.deleteThreads = async (req, res) => {
  try {
    const { apikey, thread_id } = req.body;
    let responseDeleteThread = await axios({
      method: "post",
      url: `${process.env.GPT_SERVICES}/threads/delete`,
      data: { apikey: apikey, thread_id: thread_id },
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      timeout: 600000,
    });

    if (responseDeleteThread.data && responseDeleteThread.statusText === "OK") {
      return res.json(responseDeleteThread.data);
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
