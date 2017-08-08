(function ($) {

    /**
     * Dependent package(jQuery & bootstrap)
     */


    $.fn.extend({
        uploadFiles: UploadFiles,
    });

    function isEmptyObject(obj) {
        var i = 0;
        for (var item in obj) {
            i++;
        }
        if (i == 0) {
            return true;
        }
        return false;
    }

    function UploadFiles(params) {

        /**
         * UploadFiles the project to an params.
         * @param {string} params.url - required
         * @param {string} params.fileUploadBtnText - 
         * @param {string} params.filesListParentElement - 
         * @param {object} params.formParams - 
         * @param {string} params.isUploadMultipleFiles - 
         * @param {function} params.onUploadFileSuccess - callback
         * @param {function} params.onUploadFileError - callback
         * @param {function} params.onUploadEnd - callback
         * @param {function} params.onUploadAbort - callback
         * 
         */

        this.url = params.url; 

        this.fileUploadBtnText = params.fileUploadBtnText || 'Choose File';

        this.filesListParentElement = params.filesListParentElement;

        this.$filesListElement = null;

        this.isCreateFilesListNode = params.filesListParentElement ? false : true;

        this.formParams = params.formParams || {};
        //

        this.allFiles = {};

        this.dirs = {};
        
        this.uploadFormDatas = [];

        this.fileKey = 0;

        this.uploadFilesCancle = false;

        this.abortUpload = function () { };

        this.uploadInterrupted = false;

        this.currentAjax = null;

        //
        this.isUploadMultipleFiles = params.isUploadMultipleFiles || 'true';

        // methods
        this.render = render;

        this.actions = actions;

        this.showFileInfo = showFileInfo;

        this.uploadFiles = uploadFiles;

        this.toUploadFile = toUploadFile;

        this.onProgress = onProgress;

        // callback
        this.onUploadFileSuccess = params.onUploadFileSuccess || function (result) {};

        this.onUploadFileError = params.onUploadFileError || function (err, dir) {};

        this.onUploadEnd = params.onUploadEnd || function (e) { };

        this.onUploadAbort = params.onUploadAbort || function (files) {};

        // 
        this.render();       
    }

    //
    function render(callback) {

        console.log('this...', this);

        var that = this;

        $(this).css('display', 'none');   

        $(this).after(
            '<div role="fileChoose" class="file-choose-btn"><span class="glyphicon glyphicon-file"></span>&nbsp;' + this.fileUploadBtnText + '</div>'
        );

        if (!this.filesListParentElement) {
            var ele = document.createElement('div');
            ele.className = 'files-upload-situation-div';
            document.body.appendChild(ele);

            this.filesListParentElement = ele;

        }

        $(this.filesListParentElement).append('<div class="files-upload-situation"></div>');
        
        this.$filesListElement = $(this.filesListParentElement).children('.files-upload-situation');
        
        //
        var fileActionsHtml = '';
        if (this.isUploadMultipleFiles == 'true') {
            fileActionsHtml += '<a href="javascript:;" class="files-action-group-item" role="uploadSubmit"><span class="glyphicon glyphicon-cloud-upload"></span>&nbsp;Upload</a>'
        }
        
        this.$filesListElement.append('<div class="files-action-group">' 
                        + '<div class="all-files-remove-div">' 
                            + '<div class="all-files-remove"><span>+</span></div>'
                        + '</div>'
                        + '<div class="files-action-group-div">' 
                            + fileActionsHtml
                            + '<a href="javascript:;" class="files-action-group-item" role="uploadAbort"><span class="glyphicon glyphicon-minus-sign"></span>&nbsp;Abort</a>'
                        + '</div>'
                    + '</div>');

        //
        this.actions();                
    }

    //
    function actions() {
        var that = this;
        var element = this.filesListParentElement;

        this.$filesListElement.find('.all-files-remove').click(function () {
            that.allFiles = {};
            that.dirs = {};                    
            that.uploadFormDatas = [];
            that.fileKey = 0;
            that.uploadInterrupted = true;

            that.$filesListElement.find('.progress-info').remove();

            if (that.isCreateFilesListNode) {
                $(element).animate({marginTop: '0'});
            }
        });

        $(this).next('.file-choose-btn').click(function () {
            $(that).trigger('click');
        });

        $(this).change(function () {
            var formData = new FormData();
            formData.append('file', $(this)[0].files[0]);

            for (var item in that.formParams) {
                formData.append(item, that.formParams[item]);
            }

            var name = $(this)[0].files[0].name;

            var dir = $(this).val(); 

            if (!that.dirs[dir]) {
                var info = {
                    fileKey: that.fileKey,
                    dir: dir,
                    formData: formData
                };
                that.dirs[dir] = info;
                that.allFiles[that.fileKey] = info;

                that.showFileInfo(name);
            }

            if (that.isUploadMultipleFiles == 'false') {
                that.uploadFiles();
            }

            this.value = '';
            console.log('this.dirs, this.allFiles..', that.dirs, that.allFiles);
        });

        var $actionNodes = this.$filesListElement.find('.files-action-group-item');

        $actionNodes.click(function () {
            if ($(this).attr('role') == 'uploadAbort') {
                that.uploadFilesCancle = true;        

                console.log('currentAjax..', that.currentAjax);
                if (that.currentAjax) {
                    that.currentAjax.abort();

                    that.onUploadAbort(that.allFiles);
                }
            }

            if ($(this).attr('role') == 'uploadSubmit') {

                if (isEmptyObject(that.dirs)) {
                    alert('Please choose file!');
                    return;
                }

                that.uploadInterrupted = false;
                that.uploadFilesCancle = false;
                that.uploadFiles();
            }
        });

        //
        
    }

    //
    function showFileInfo(name) {
        var that = this;

        var key = this.fileKey;

        var element = this.filesListParentElement;

        this.$filesListElement.append(
            '<div class="progress-info" id="progressInfo' + key + '" role="' + key + '">'
                + '<div class="progress-info-head">'
                    + '<div class="file-upload-status"></div>'
                    + '<div class="file-remove-div"><div class="file-remove"><span class="glyphicon glyphicon-trash"></span></div></div>'
                + '</div>'
                + '<div class="progress-info-title">'
                    + '<p class="file-name"><span style="color: #D579E8; font-weight: bold; font-size: 14px;">#</span>&nbsp;' + name + '</p>'
                    + '<p class="file-upload-info">Percent: <span id="percent' + key + '">0</span>&nbsp;&nbsp;Rate: <span id="rate' + key + '">0</span></p>'
                + '</div>'
                + '<div class="progress-bar" id="progressBar' + key + '"> </div>'
            + '</div>'
        );

        if (that.isCreateFilesListNode) {
            $(element).animate({marginTop: '-350px'}, 500);
        }

        this.$filesListElement.find('#progressInfo' + key).fadeIn(500);

        this.$filesListElement.find('.file-remove').click(function () {
            var key = $(this).closest('.progress-info').attr('role');
            var dir = that.allFiles[key].dir;
            delete that.dirs[dir];
            delete that.allFiles[key];                    

            $(this).closest('.progress-info').slideUp(1000, function () {
                $(this).remove();

                var allFilesNodes = that.$filesListElement.find('.progress-info');
                console.log('allF..', allFilesNodes);
                if (allFilesNodes.length == 0) {
                    if (that.isCreateFilesListNode) {
                        $(element).animate({marginTop: '0'}, 600);
                    }
                }

            });

        });

        this.fileKey++;
    }

    //
    function uploadFiles() {
        this.uploadFormDatas = [];
        var url = this.url;

        console.log('url...', url, this.allFiles);
        for (var item in this.allFiles) {
            this.uploadFormDatas.push(this.allFiles[item]);
        }

        this.toUploadFile(url, 0)
    }

    function toUploadFile(url, index) {
        var that = this;

        var element = this.filesListParentElement;

        if (!this.uploadFormDatas[index]) {

            this.onUploadEnd(this);
            return ;
        }

        var fileKey = this.uploadFormDatas[index].fileKey;

        var formData = this.uploadFormDatas[index].formData;

        this.currentAjax = $.ajax(url, {
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {

                var xhr = $.ajaxSettings.xhr();

                console.log('xhr....', xhr);

                that.onProgress(xhr, url, index, fileKey);   
                
                xhr.onloadend = function () {
                    console.log('end...');        

                    if (that.uploadFilesCancle || that.uploadInterrupted) {
                        return xhr;
                    }

                    that.toUploadFile(url, index + 1);
                }
                
                return xhr;
            },
            success: function (result) {
                console.log('success..');
                that.onUploadFileSuccess(result);

                if (that.uploadInterrupted) {
                    return;
                }

                var dir = that.allFiles[fileKey].dir;
                delete that.dirs[dir];
                delete that.allFiles[fileKey];

                that.$filesListElement.find('#progressBar' + fileKey).addClass('file-upload-success');
                that.$filesListElement.find('#progressBar' + fileKey).closest('.progress-info').addClass('progress-file-upload-success');
                that.$filesListElement.find('#progressBar' + fileKey).closest('.progress-info').find('.file-upload-status').html(
                    '<span class="glyphicon glyphicon-ok" style="color: #93EFFF;"></span>'
                );
                setTimeout(function () {
                    that.$filesListElement.find('#progressBar' + fileKey).closest('.progress-info').slideUp(1000, function () {
                        $(this).remove();

                        var allFilesNodes = that.$filesListElement.find('.progress-info');
                        if (allFilesNodes.length == 0) {
                            if (that.isCreateFilesListNode) {
                                $(element).animate({marginTop: '0'}, 600);
                            }
                        }

                    });
                }, 2000);                

                
            },
            error: function (err) {
                var dir = that.allFiles[fileKey].dir;
                if (!that.uploadFilesCancle) {
                    that.$filesListElement.find('#progressBar' + fileKey).closest('.progress-info').addClass('progress-file-upload-error');
                    that.$filesListElement.find('#progressBar' + fileKey).closest('.progress-info').find('.file-upload-status').html(
                        '<span class="glyphicon glyphicon-remove" style="color: #F47775;"></span>'
                    );
                }

                that.onUploadFileError(err, dir);
            }
        });
        
    }

    //
    function onProgress(xhr, url, index, fileKey) {
        var that = this;
        var progressIndex = index;

        var timeStamp = 0;
        var loaded = 0;
        var start = Date.now();

        console.log('time...');
        xhr.upload.addEventListener('progress', function(e) {

            console.log('e....', e);

            var curProgress = Math.floor(e.loaded * 100 / e.total);
            var timeInterval = 0;
            var rate = 0;

            if (timeStamp > 0) {
                timeInterval = e.timeStamp - timeStamp;
                console.log('next...', timeInterval);
            } else {
                timeInterval = Date.now() - start;
                console.log('first...', timeInterval);
            }

            rate = ((e.loaded - loaded) / (1024 * timeInterval)) * 1000;

            console.log('rate...', rate);

            var rateStr = '';
            if (rate >= 1024) {
                rateStr = (rate/1024).toFixed(2) + 'M/S'
            } else {
                rateStr = Math.round(rate) + 'KB/S' ;
            }

            timeStamp = e.timeStamp;
            loaded = e.loaded;

            that.$filesListElement.find('#rate' + fileKey).text(rateStr);

            var width = curProgress <= 100 ? (curProgress + '%') : '100%';
            that.$filesListElement.find('#percent' + fileKey).text(width);
            that.$filesListElement.find('#progressBar' + fileKey).css('width', width );

        }, false);
    }


}(jQuery));