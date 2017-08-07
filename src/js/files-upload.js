(function ($) {

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

    $.fn.uploadFiles = function (params) {
        console.log(this);

        this.url = params.url; // Required

        this.fileUploadBtnText = params.fileUploadBtnText || 'Choose File';

        this.filesListId = params.filesListId;
        //

        this.allFiles = {};

        this.dirs = {};
        
        this.uploadFormDatas = [];

        this.fileKey = 0;

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

        //
        this.render();
        
    }

    function render(callback) {
        var that = this;
        var submitHtml = '';
        if (this.isUploadMultipleFiles == 'true') {
            submitHtml = '<div class="row">'
                            + '<button role="filesSubmit" type="button" class="btn btn-warning" id="uploadFileSubmit">Upload</button>'
                        + '</div>';
        }

        $(this).css('display', 'none');                
        $(this).after(
            '<div class="file-upload">'
                + '<div class="row">'
                    + '<button role="fileChoose" type="button" class="btn btn-info">'
                        + this.fileUploadBtnText
                    + '</button>'
                + '</div>'
                + submitHtml
            + '</div>'
        );

        if (!this.filesListId) {
            var ele = document.createElement('div');
            ele.id = 'filesUploadSituation';
            document.body.appendChild(ele);

            this.filesListId = 'filesUploadSituation';
            $(ele).append('<div class="all-files-remove-div"><div class="all-files-remove">+</div></div>');
        }
        
        this.actions();                
    }

    function actions() {
        var that = this;
        var url = this.url;
        var id = this.filesListId;

        $('#' + id).find('.all-files-remove').click(function () {
            that.allFiles = {};
            that.dirs = {};                    
            that.uploadFormDatas = [];
            that.fileKey = 0;

            $('#' + id).find('.progress-info').remove();
            $('#' + id).animate({marginTop: '0'});
        });

        $(this).next('.file-upload').find('button[role=fileChoose]').click(function () {
            $(that).trigger('click');
        });

        $(this).change(function () {
            var formData = new FormData();
            formData.append('file', $(this)[0].files[0]);
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
                that.uploadFiles(url);
            }

            this.value = '';
            console.log('this.dirs, this.allFiles..', that.dirs, that.allFiles);
        });

        $(this).next('.file-upload').find('button[role=filesSubmit]').click(function () {

            if (isEmptyObject(that.dirs)) {
                alert('Please choose file!');
                return;
            }

            that.uploadFiles(url);
        });

        //
        
    }

    function showFileInfo(name) {
        var that = this;

        var key = this.fileKey;

        var id = this.filesListId;

        $('#' + id).append(
            '<div class="progress-info" role="' + key + '">'
                + '<div class="file-remove-div"><div class="file-remove">+</div></div>'
                + '<div class="progress-info-title">'
                    + '<p class="file-name"><span style="color: #D579E8; font-weight: bold; font-size: 14px;">#</span>&nbsp;' + name + '</p>'
                    + '<p class="file-upload-info">Percent: <span id="percent' + key + '">0</span>&nbsp;&nbsp;Rate: <span id="rate' + key + '">0</span></p>'
                + '</div>'
                + '<div class="progress-bar" id="progressBar' + key + '"> </div>'
            + '</div>'
        );

        $('#' + id).animate({marginTop: '-350px'}, 500);

        $('.file-remove').click(function () {
            var key = $(this).closest('.progress-info').attr('role');
            var dir = that.allFiles[key].dir;
            delete that.dirs[dir];
            delete that.allFiles[key];                    

            $(this).closest('.progress-info').slideUp(1000, function () {
                $(this).remove();

                var allFilesNodes = $('#' + id).find('.progress-info');
                console.log('allF..', allFilesNodes);
                if (allFilesNodes.length == 0) {
                    $('#' + id).animate({marginTop: '0'}, 600);
                }

            });

        });

        this.fileKey++;
    }

    function uploadFiles(url) {
        this.uploadFormDatas = [];

        for (var item in this.allFiles) {
            this.uploadFormDatas.push(this.allFiles[item]);
        }

        this.toUploadFile(url, 0)
    }

    function toUploadFile(url, index) {
        var that = this;

        var id = this.filesListId;

        if (!this.uploadFormDatas[index]) {

            var allFilesNodes = $('#' + this.filesListId).find('.progress-info');
            if (allFilesNodes.length == 0) {

            }

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
                
                return xhr;
            },
            success: function () {
                console.log('success..');
                $('#progressBar' + fileKey).addClass('file-upload-success');
                setTimeout(function () {
                    $('#progressBar' + fileKey).closest('.progress-info').slideUp(1000, function () {
                        $(this).remove();

                        var allFilesNodes = $('#' + id).find('.progress-info');
                        if (allFilesNodes.length == 0) {
                            $('#' + id).animate({marginTop: '0'}, 600);
                        }

                    });
                }, 2000);
                var dir = that.allFiles[fileKey].dir;
                delete that.dirs[dir];
                delete that.allFiles[fileKey];

                that.onUploadFileSuccess(dir);
            },
            error: function (err) {
                var dir = that.allFiles[fileKey].dir;
                $('#progressBar' + fileKey).closest('.progress-info').css('background', 'rgba(255,126,160,0.4)');
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

            $('#rate' + fileKey).text(rateStr);

            var width = curProgress <= 100 ? (curProgress + '%') : '100%';
            $('#percent' + fileKey).text(width);
            $('#progressBar' + fileKey).css('width', width );

        }, false);

        xhr.onloadend = function () {
            console.log('end...');            

            progressIndex++;

            that.toUploadFile(url, progressIndex);
        }
    }

}(jQuery))