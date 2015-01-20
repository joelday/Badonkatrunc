// Badonkatrunc 1.0.0, (http://badonkatrunc.com)
// Copyright (c) 2012 Plexipixel, Inc. (http://plexipixel.com)

// Developed by: Joel Day (joeld@plexipixel.com)
// Co-conspirator: David Seelig

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

(function($) {
    
    // Public facing plugin methods
    var methods = {
        init: function(options) {
            var all = this;
            
            var instanceOptions = $.extend(true, {}, $.fn.badonkatrunc.defaultOptions, options);
                
            if (instanceOptions.fitDirection != 'horizontal' &&
                instanceOptions.fitDirection != 'vertical') {
                
                $.error("'" + instanceOptions.fitDirection + "' is not a valid fit direction. Use 'horizontal' or 'vertical.'");
                return this;
            }
            
            if (instanceOptions.truncateLocation != 'start' &&
                instanceOptions.truncateLocation != 'middle' &&
                instanceOptions.truncateLocation != 'end') {
                
                $.error("'" + instanceOptions.truncateLocation + "' is not a valid truncation location. Use 'start,' 'middle' or 'end.'");
                return this;
            }
            
            if (instanceOptions.minimumFontSize > instanceOptions.maximumFontSize) {
                $.error("Minimum font size can not exceed the maximum font size.");
                return this;
            }
            
            if (instanceOptions.minimumLetterSpacing > instanceOptions.maximumLetterSpacing) {
                $.error("Minimum letter spacing can not exceed the maximum letter spacing.");
                return this;
            }
            
            return this.each(function() {
                var $this = $(this);
                var data = $(this).data('badonkatrunc');
                
                // Destroy existing instances.
                if (data) {
                    $this.badonkatrunc('destroy');
                }
                
                var instance = pluginInstance($this, instanceOptions, all);
                $(this).data('badonkatrunc', instance);
                
                instance.init();
                
                if (instance.options.automaticSizeTracking) {
                    resizeMonitor.add(instance);
                }
            });
        },
        destroy: function() {
            return this.each(function() {
                var $this = $(this);
                var data = $this.data('badonkatrunc');
                
                data.destroy();
                resizeMonitor.remove(data);
                dirtyMonitor.remove(data);
                
                $(window).unbind('.badonkatrunc');
                $this.removeData('badonkatrunc');
            });
        },
        refresh: function() {
            return this.each(function() {
                var $this = $(this);
                var data = $this.data('badonkatrunc');
                
                dirtyMonitor.remove(data);
                data.refresh();
            });
        },
        changeContents: function(newContents) {
            return this.each(function() {
                var $this = $(this);
                var data = $this.data('badonkatrunc');
                
                if (typeof(newContents) == 'string') {
                    data.contentHtml = $('<span></span>').text(newContents).html();
                } else {
                    data.contentHtml = $(newContents).html();
                }
                
                dirtyMonitor.add(data);
            });
        }
    };
    
    jQuery.uaMatch = function( ua ) {
        ua = ua.toLowerCase();
        var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
            /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
            /(msie) ([\w.]+)/.exec( ua ) ||
            ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) || [];
        return {
            browser: match[ 1 ] || "",
            version: match[ 2 ] || "0"
        };
    };
    
    if ( !jQuery.browser ) {
        var 
        matched = jQuery.uaMatch( navigator.userAgent ),
        browser = {};
        if ( matched.browser ) {
            browser[ matched.browser ] = true;
            browser.version = matched.version;
        }
        // Chrome is Webkit, but Webkit is also Safari.
        if ( browser.chrome ) {
            browser.webkit = true;
        } else if ( browser.webkit ) {
            browser.safari = true;
        }
        jQuery.browser = browser;
    }
    
    // jQuery plugin interface
    $.fn.badonkatrunc = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.badonkatrunc');
        }
    };
    
    $.fn.badonkatrunc.settings = {
        sizeTrackingTimeout: 1000 / 60
    };
    
    // Default options
    $.fn.badonkatrunc.defaultOptions = {
        // meta/general
        automaticSizeTracking: false,
        fitDirection: 'horizontal', // 'horizontal', 'vertical'
        
        // font size
        minimumFontSize: 1.0,
        maximumFontSize: 1.0,
        fontSizeSynced: false,
        
        // font layout
        minimumLetterSpacing: 0.0,
        maximumLetterSpacing: 0.0,
        letterSpacingSynced: false,
        
        // truncation
        truncate: true,
        truncateString: '&hellip;',
        truncateLocation: 'end', // 'start', 'middle', 'end'
        truncateOnlyWholeWords: false,
        
        extraOptimizeLimit: 8
    };
    
    // Shorthand namespace
    $.fn.btrunc = $.fn.badonkatrunc;
    
    // Private instance and methods
    var pluginInstance = function($target, options, $targetGroup) {
        var createRenderState = function(content, fontSize, letterSpacing) {
            return {
                content: content,
                fontSize: fontSize,
                letterSpacing: letterSpacing  
            };
        };
        
        var instance = {
            target: $target,
            options: options,
            refresh: function() {
                var self = this;
                
                var view = createHtmlTextView(this.contentHtml);

                // These values represent the current retained state for the duration of the refresh
                var text = this.contentHtml;
                var fontSize = this.options.maximumFontSize;
                var letterSpacing = this.options.maximumLetterSpacing;
                
                var renderFunc = function() {
                    var state = createRenderState(text, fontSize, letterSpacing);
                    self.renderState(state);
                }
                
                var overflowFunc = function() {
                    return self.getCurrentOverflow();
                }
                
                // Font size
                if (this.options.maximumFontSize - this.options.minimumFontSize > 0) {
                    optimize(self.options.minimumFontSize, self.options.maximumFontSize, function(value) {
                        fontSize = value;
                        renderFunc();
                    },
                    overflowFunc);
                }
                
                // Letter spacing
                if (this.options.maximumLetterSpacing - this.options.minimumLetterSpacing > 0) {

                    var truncationLevel = 1.0;

                    // Word truncation
                    if (this.options.truncate) {
                        optimize(0.0, 1.0, function(value) {
                            truncationLevel = value;
                            
                            text = getTruncatedHtml(view, self.options.truncateString, self.options.truncateLocation, value, true);
                            
                            // Nested letter spacing O P T I M I Z A T I O N
                            optimize(self.options.minimumLetterSpacing, 0.0, function(value) {
                                letterSpacing = value;
                                renderFunc();
                            },
                            overflowFunc);
                            
                            renderFunc();
                        },
                        overflowFunc);
                    }
                    
                    if (truncationLevel == 1.0) {
                        
                        // Letter spacing
                        optimize(self.options.minimumLetterSpacing, self.options.maximumLetterSpacing, function(value) {
                            letterSpacing = value;
                            renderFunc();
                        },
                        overflowFunc);
                    }
                }
                
                // Final truncation
                if (this.options.truncate) {
                    optimize(0.0, 1.0, function(value) {
                        text = getTruncatedHtml(view, self.options.truncateString, self.options.truncateLocation, value, self.options.truncateOnlyWholeWords);
                        renderFunc();
                    },
                    overflowFunc, this.options.extraOptimizeLimit);
                }
                
                // One last render in the event that no optimization attempt was made
                this.renderState(createRenderState(text, fontSize, letterSpacing), !this.options.truncate);
                
                this.currentOptimalState = this.currentRenderedState;
                
                this.syncFonts();
            },
            syncFonts: function() {
                if ($targetGroup.length > 1 && (this.options.fontSizeSynced || this.options.letterSpacingSynced)) {
                    var lowestFontSize = this.currentOptimalState.fontSize;
                    var lowestLetterSpacing = this.currentOptimalState.letterSpacing;
                    
                    for (var i = 0; i < $targetGroup.length; i++) {
                        var groupInstance = $($targetGroup[i]).data('badonkatrunc');
                        
                        if (groupInstance != null && groupInstance.currentOptimalState != null) {
                            if (groupInstance.currentOptimalState.fontSize < lowestFontSize) {
                                lowestFontSize = groupInstance.currentOptimalState.fontSize;
                            }
                            
                            if (groupInstance.currentOptimalState.letterSpacing < lowestLetterSpacing) {
                                lowestLetterSpacing = groupInstance.currentOptimalState.letterSpacing;
                            }
                        }
                    }
                    
                    for (var i = 0; i < $targetGroup.length; i++) {
                        var groupInstance = $($targetGroup[i]).data('badonkatrunc');
                        if (groupInstance != null) {
                            groupInstance.acceptFontSync(lowestFontSize, lowestLetterSpacing);
                        }
                    }
                }
            },
            acceptFontSync: function(fontSize, letterSpacing) {
                var self = this;
                var view = createHtmlTextView(this.contentHtml);
                var text = this.contentHtml;
                
                if (this.currentOptimalState != null)
                {
                    if (!this.options.fontSizeSynced) {
                        fontSize = this.currentOptimalState.fontSize;
                    }
                    
                    if (!this.options.letterSpacingSynced) {
                        letterSpacing = this.currentOptimalState.letterSpacing;
                    }
                }
                
                var renderFunc = function() {
                    self.renderState(createRenderState(text, fontSize, letterSpacing));
                }
                
                var overflowFunc = function() {
                    return self.getCurrentOverflow();
                }
                
                // Perform truncation
                if (this.options.truncate) {
                    optimize(0.0, 1.0, function(value) {
                        text = getTruncatedHtml(view, self.options.truncateString, self.options.truncateLocation, value, self.options.truncateOnlyWholeWords);
                        renderFunc();
                    },
                    overflowFunc);
                }

                this.renderState(createRenderState(text, fontSize, letterSpacing), !this.options.truncate);
            },
            init: function() {
                this.contentHtml = this.target.html();
                
                this.settingsWrapper = $('<span style="display: block; margin: 0px; padding: 0px; border: 0px;"></span>');
                this.settingsWrapper.addClass('badonkatrunc-wrapper');

                this.target.empty();
                this.target.append(this.settingsWrapper);
                
                this.refresh();
            },
            destroy: function() {
                this.target.empty();
                this.target.append(this.contentHtml);
            },
            renderState: function(state, forceAllowWrap) {
                this.settingsWrapper.css('font-size', state.fontSize + 'em');
                this.settingsWrapper.css('letter-spacing', state.letterSpacing + 'em');
                
                var whiteSpace = (!forceAllowWrap && this.options.fitDirection == 'horizontal') ? 'nowrap' : 'normal';
                this.settingsWrapper.css('white-space', whiteSpace);

                this.settingsWrapper.empty();
                this.settingsWrapper.append(state.content);
                this.currentRenderedState = state;
            },
            getCurrentOverflow: function() {
                var wrapper = this.settingsWrapper[0];
                var overflow = (this.options.fitDirection == 'horizontal') ? wrapper.scrollWidth - $target.width() : wrapper.offsetHeight - $target.height();
                return overflow;
            }
        };
        
        return instance;
    };
    
    // Monitor factory
    // If there is no timeout, it will process the instances once for the next event loop, then clear the instances
    var createDispatcher = function(updateFunc, addFunc, removeFunc, updateTimeout) {
        var dispatcherInstance = {
            _instances: [],
            _updateLoop: function() {
                if ($.isFunction(updateFunc)) {
                    for (var i = 0; i < dispatcherInstance._instances.length; i++) {
                        updateFunc(dispatcherInstance._instances[i]);
                    }
                }
                
                if (updateTimeout != null) {
                    if (dispatcherInstance._instances.length > 0) {
                        setTimeout(dispatcherInstance._updateLoop, updateTimeout);
                    }
                } else {
                    dispatcherInstance._instances = [];
                }
            },
            add: function(instance) {
                if ($.inArray(instance, this._instances) != -1) {
                    return;
                }
                
                if ($.isFunction(addFunc)) {
                    addFunc(instance);
                }

                this._instances.push(instance);

                if (this._instances.length == 1) {
                    if (updateTimeout == null) {
                        setTimeout(this._updateLoop);
                    }
                    else {
                        this._updateLoop();
                    }
                }
            },
            remove: function(instance) {
                var index = $.inArray(instance, this._instances);
                
                if (index != -1) {
                    this._instances.splice(index, 1);
                    
                    if ($.isFunction(removeFunc)) {
                        removeFunc(instance);
                    }
                }
            }
        };
        
        return dispatcherInstance;
    };
    
    // Element size change tracker
    var resizeMonitor = createDispatcher(
        function(instance) {
            instance.elementSizeCache.update();
        },
        function(instance) {
            instance.elementSizeCache = {
                width: null,
                height: null,
                update: function() {
                    var newWidth = instance.target.width();
                    var newHeight = instance.target.height();

                    var hasChanged = ((this.width != null && newWidth != this.width) || (this.height != null && newHeight != this.height));
                    this.width = newWidth;
                    this.height = newHeight;

                    if (hasChanged) {
                        this.changed();
                    }
                },
                changed: function() {
                    dirtyMonitor.add(instance);
                }
            };
        },
        function(instance) {
            instance.elementSizeCache = undefined;
        },
        $.fn.badonkatrunc.settings.sizeTrackingTimeout
    );
    
    // Batched refresh dispatcher
    var dirtyMonitor = createDispatcher(
        function(instance) {
            instance.refresh.apply(instance);
        },
        null,
        null,
        null
    );
    
    var getTruncatedHtml = function(htmlTextView, truncateString, truncateLocation, amount, wordRounded) {
        var text = htmlTextView.text;
        
        if (amount > 1.0) {
            amount = 1.0;
        }
        
        if (amount < 0.0) {
            amount = 0.0;
        }
        
        if (amount == 1.0) {
            return htmlTextView.html;
        }
        
        var getTruncatedRange = function(begin, length) {
            var words = text.split(' ');
            var totalEntities = (wordRounded) ? words.length : text.length;
            
            var entityBegin = totalEntities * begin;
            var entityLength = totalEntities * length;
            
            if (wordRounded) {
                var getCharacterPosition = function(wordIndex) {
                    var characterCount = 0;
                    
                    for (var i = 0; i < wordIndex; i++) {
                        characterCount += words[i].length + 1;
                    }
                    
                    return characterCount;
                };
                
                var endWord = entityBegin + entityLength;
                
                entityBegin = getCharacterPosition(entityBegin);
                entityLength = getCharacterPosition(endWord) - entityBegin;
            }
            
            return htmlTextView.getHtmlSubstring(entityBegin, entityLength);
        };
        
        switch (truncateLocation) {
            case 'middle':
                var amountPerSide = amount / 2;
                
                var left = getTruncatedRange(0, amountPerSide);
                var right = getTruncatedRange(1.0 - amountPerSide, amountPerSide);

                return $.trim(left) + ' ' + truncateString + ' ' + $.trim(right);
            case 'start':
                var truncated = getTruncatedRange(1.0 - amount, amount);
                
                return truncateString + $.trim(truncated);
            case 'end':
                var truncated = getTruncatedRange(0, amount);
                
                return $.trim(truncated) + truncateString;
        }
    };
    
    var createHtmlTextView = function(contentHtml) {
        var $content = $('<span></span>');
        $content.html(contentHtml);
        
        var view = {
            html: contentHtml,
            text: $content.text(),
            getHtmlSubstring: function(index, length) {
                var element = $content.clone()[0];
                
                var totalProcessedLength = 0;
                var totalOutputLength = 0;
                var nodesWithinRange = [];

                var withinRange = false;
                
                var stripOutOfRangeTextInElement = function(node) {
                    if (node.nodeType == 3) {
                        var dataLength = node.data.length;
                        var newData = '';
                        
                        var wasWithinRange = false;
                        
                        for (var i = 0; i < dataLength; i++) {
                            totalProcessedLength++;
                            if (totalProcessedLength >= index && totalOutputLength < length) {
                                withinRange = true;
                                wasWithinRange = true;
                                newData += node.data.substr(i, 1);
                                totalOutputLength++;
                            } else {
                                if (withinRange == true) {
                                    withinRange = false;
                                }
                            }
                        }
                        
                        node.data = newData;
                        
                        if (wasWithinRange) {
                            nodesWithinRange.push(node);
                        }
                    } else if (node.nodeType == 1) {
                        
                        if (withinRange) {
                            nodesWithinRange.push(node);
                        }
                        
                        var childCount = node.childNodes.length;
                        for (var i = 0; i < childCount; i++) {
                            stripOutOfRangeTextInElement(node.childNodes[i]);
                        }
                    }
                };
                
                stripOutOfRangeTextInElement(element);
                
                var parentNodesToKeep = [];
                
                var markParentNodesToKeep = function(element) {
                    var keepNode = function(node) {
                        parentNodesToKeep.push(node);
                        if (node.parentNode != null) {
                            keepNode(node.parentNode);
                        }
                    };
                    
                    keepNode(element);
                };
                
                var nodesWithinRangeCount = nodesWithinRange.length;
                for (var t = 0; t < nodesWithinRangeCount; t++) {
                    markParentNodesToKeep(nodesWithinRange[t]);
                }
                
                var removeUnusedNodes = function(node) {
                    var nodesToRemove = [];
                    
                    var childNodeCount = node.childNodes.length;
                    
                    for (var i = 0; i < childNodeCount; i++) {
                        var childNode = node.childNodes[i];
                        
                        if (childNode.nodeType != 3) {
                            if ($.inArray(childNode, parentNodesToKeep) == -1) {
                                nodesToRemove.push(childNode);
                            } else {
                                removeUnusedNodes(childNode);
                            }
                        }
                    }
                    
                    for (var i = 0; i < nodesToRemove.length; i++) {
                        var node = nodesToRemove[i];
                        node.parentNode.removeChild(node);
                    }
                };
                
                removeUnusedNodes(element);

                return $(element).html();
            }
        };
        
        return view;
    };
    
    var optimize = function(min, max, actionFunc, overflowFunc, extraOptimizeLimit) {
        var currentMax = max;
        var currentMin = min;
        
        var currentValue = max;
        
        var lastResult = null;
        
        var mostOptimalResult = null;
        var mostOptimalValue = null;
        
        var sameResultCount = 0;
        
        while (true) {
            actionFunc(currentValue);
            
            var result = overflowFunc();
            
            if (result <= 0) {
                var moreOptimal = true;
            
                if (mostOptimalResult != null) {
                    if (mostOptimalResult > result) {
                        moreOptimal = false;
                    } else if (result == mostOptimalResult) {
                        if (currentValue <= mostOptimalValue) {
                            moreOptimal = false;
                        }
                    }
                }
                
                if (moreOptimal) {
                    mostOptimalResult = result;
                    mostOptimalValue = currentValue;
                }
            }
            
            if (result == lastResult) {
                // No change since last attempt.
                
                sameResultCount++;
                if (extraOptimizeLimit == undefined || sameResultCount == extraOptimizeLimit) {
                    if (mostOptimalValue != null) {
                        actionFunc(mostOptimalValue);
                    }
                
                    return;
                }
            }
            
            if (result > 0) { // Not enough space.
                currentMax = currentValue;
                
                var difference = (currentValue - currentMin);
                currentValue -= (difference / 2);
            } else if (result <= 0) { // Extra space.
                currentMin = currentValue;
                currentValue = currentMax;
            }
            
            lastResult = result;
        }
    };
    
})(jQuery);
