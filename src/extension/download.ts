import ErrorMessage from './errorMessage';

export default class Download {
    /**
     * 下载录音文件
     * @private
     * @param {*} blob      blob数据
     * @param {string} name 下载的文件名
     * @param {string} type 下载的文件后缀
     * @memberof Recorder
     */
    download(blob, name: string, type: string): void {
        try {
            let oA = document.createElement('a');
            
            // 生成资源路径
            oA.href = window.URL.createObjectURL(blob);
            oA.download = name + '.' + type;
            // 配置 download 属性并点击下载，若无法下载，可以考虑先 appendChild 到dom树中再下载，最后记得 remove .
            oA.click();
        } catch(e) {
            ErrorMessage.throwError(e);
        }
    }
}