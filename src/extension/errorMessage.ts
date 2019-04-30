let errorCode = {};     // 存放些错误码

export default class ErrorMessage {
    /**
     * 抛出异常处理
     *
     * @param {string} code    错误码或错误信息
     * @memberof ErrorMessage
     */
    static throwError(code: string) {
        let msg = errorCode[ code ] || code;

        throw new Error(msg);
    }
}