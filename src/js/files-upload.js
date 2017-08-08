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
         * 
         */


        this.url = params.url; // Required

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
        this.onUploadFileSuccess = params.onUploadFileSuccess || function (dir) {};

        this.onUploadFileError = params.onUploadFileError || function (dir) {};

        this.onUploadEnd = params.onUploadEnd || function () { };

        // 
        this.render();       
    }

    function render(callback) {

        console.log('this...', this);

        var that = this;

        $(this).css('display', 'none');                
        $(this).after(
            '<div class="file-upload">'
                + '<div class="row">'
                    + '<button role="fileChoose" type="button" class="btn btn-info">'
                        + this.fileUploadBtnText
                    + '</button>'
                + '</div>'
            + '</div>'
        );

        if (!this.filesListParentElement) {
            var ele = document.createElement('div');
            ele.id = 'filesUploadSituation';
            document.body.appendChild(ele);

            this.filesListParentElement = ele;
        }

        $(this.filesListParentElement).append('<div class="files-upload-situation"></div>');
        
        this.$filesListElement = $(this.filesListParentElement).children('.files-upload-situation');
        
        //
        var fileActionsHtml = '';
        if (this.isUploadMultipleFiles == 'true') {
            fileActionsHtml += '<a href="javascript:;" class="files-action-group-item" role="uploadSubmit">Upload</a>'
        }
        
        this.$filesListElement.append('<div class="files-action-group">' 
                        + '<div class="all-files-remove-div">' 
                            + '<div class="all-files-remove"><span>+</span></div>'
                        + '</div>'
                        + '<div class="files-action-group-div">' 
                            + fileActionsHtml
                            + '<a href="javascript:;" class="files-action-group-item" role="uploadCancle">Cancle</a>'
                        + '</div>'
                    + '</div>');

        //
        this.actions();                
    }

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

        $(this).next('.file-upload').find('button[role=fileChoose]').click(function () {
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
            if ($(this).attr('role') == 'uploadCancle') {
                that.uploadFilesCancle = true;

                that.abortUpload();
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

    function showFileInfo(name) {
        var that = this;

        var key = this.fileKey;

        var element = this.filesListParentElement;

        this.$filesListElement.append(
            '<div class="progress-info" id="progressInfo' + key + '" role="' + key + '">'
                + '<div class="file-remove-div"><div class="file-remove">+</div></div>'
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

        $('#progressInfo' + key).fadeIn(500);

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

            this.onUploadEnd();
            return ;
        }

        var fileKey = this.uploadFormDatas[index].fileKey;

        var formData = this.uploadFormDatas[index].formData;

        $.ajax(url, {
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                var xhr = $.ajaxSettings.xhr();

                that.onProgress(xhr, url, index, fileKey);   
                
                xhr.onloadend = function () {
                    console.log('end...');        

                    if (that.uploadFilesCancle || that.uploadInterrupted) {
                        return ;
                    }

                    that.toUploadFile(url, index + 1);
                }

                that.abortUpload = xhr.abort;

                console.log('upload..', that.abortUpload);
                
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
                that.$filesListElement.find('#progressBar' + fileKey).closest('.progress-info').css('background', 'rgba(255,126,160,0.4)');
                that.onUploadFileError(dir);
            }
        });
        
    }

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
            } else {
                timeInterval = Date.now() - start;
            }

            rate = (e.loaded - loaded) / 1024 / timeInterval * 1000;

            console.log('rate...', rate);

            var rateStr = '';
            if (rate >= 1024) {
                rateStr = (rate/1024).toFixed(2) + 'M/S'
            } else {
                rateStr = Math.ceil(rate) + 'KB/S' ;
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