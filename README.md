#Badonkatrunc
##jQuery plugin for dynamic text layout and truncation  
Developed by Joel Day (<joeld@plexipixel.com>) at [Plexipixel, Inc.](http://plexipixel.com), creators of Sticky Brand Play&trade;  
Demos available at [http://badonkatrunc.com](http://badonkatrunc.com) (soon)

###Overview  
Badonkatrunc dynamically resizes or truncates text to fit within the size constraints of block elements. Can be used both as a <code>text-overflow: ellipsis</code> polyfill or as a tool for responsive layout. Fully maintains nested inline and block content, including links and images.

Tested with Chrome, Firefox, IE 7+, Safari (Mac/Win/iOS) and Opera.

###Example Usage  
    // Limits contents of target elements to a single line, truncating when nessecary, based on target element width.
    $('header').badonkatrunc();
    
    // Reduces font size to 70% of the original size before truncating.
    // Increases font size up to 250% of the original size if space is available.
    $('header').badonkatrunc({ minimumFontSize: 0.7, maximumFontSize: 2.5 });

    // Reduces font size to 70% of the original size before allowing contents to wrap. No truncation occurs.
    $('header').badonkatrunc({ minimumFontSize: 0.7, truncate: false });
    
###Methods  
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Arguments</th>
        </tr>
    </thead>

    <tr>
        <td><code>destroy</code></td>
        <td>Removes Badonkatrunc from target element(s) and restores original content.</td>
        <td>none</td>
    </tr>

    <tr>
        <td><code>refresh</code></td>
        <td>Forces target element(s) to be optimized again.</td>
        <td>none</td>
    </tr>

    <tr>
        <td><code>changeContents</code></td>
        <td>Replaces the original content with new content, copied either from an HTML string or from an element that contains the new content.</td>
        <td>string | jQuery object | element</td>
    </tr>
</table>

###Options  
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Default Value</th>
            <th>Values</th>
        </tr>
    </thead>

    <tr>
        <td colspan="4"><strong>General</strong></td>
    </tr>
    <tr>
        <td><code>automaticSizeTracking</code></td>
        <td>Contents of target element(s) will be automatically optimized if the size of the target element(s) is changed.</td>
        <td><code>false</code></td>
        <td><code>true</code> | <code>false</code></td>
    </tr>
    <tr>
        <td><code>fitDirection</code></td>
        <td>Dimension (width or height) of the target element(s) used for optimization.</td>
        <td><code>'horizontal'</code></td>
        <td><code>'horizontal'</code> | <code>'vertical'</code></td>
    </tr>
    
    <tr>
        <td colspan="4"><strong>Font Size</strong></td>
    </tr>
    <tr>
        <td><code>minimumFontSize</code></td>
        <td>The minimum factor for the font size of the text within the target element(s).</td>
        <td><code>1.0</code></td>
        <td><code>0.0</code> or greater and less than or equal to <code>maximumFontSize</code></td>
    </tr>
    <tr>
        <td><code>maximumFontSize</code></td>
        <td>The minimum factor for the font size of the text within the target element(s).</td>
        <td><code>1.0</code></td>
        <td><code>0.0</code> or greater and equal to or greater than <code>minimumFontSize</code></td>
    </tr>
    <tr>
        <td><code>fontSizeSynced</code></td>
        <td>Font size of target elements will be constrained to the smallest optimal font size of the target elements.</td>
        <td><code>false</code></td>
        <td><code>true</code> | <code>false</code></td>
    </tr>
    
    
    <tr>
        <td colspan="4"><strong>Letter Spacing</strong></td>
    </tr>
    <tr>
        <td><code>minimumLetterSpacing</code></td>
        <td>The minimum letter spacing adjustment applied.</td>
        <td><code>0.0</code></td>
        <td>less than or equal to <code>maximumFontSize</code></td>
    </tr>
    <tr>
        <td><code>maximumLetterSpacing</code></td>
        <td>The maximum letter spacing adjustment applied.</td>
        <td><code>0.0</code></td>
        <td>equal to or greater than <code>minimumFontSize</code></td>
    </tr>
    <tr>
        <td><code>letterSpacingSynced</code></td>
        <td>Letter spacing of target elements will be constrained to the smallest optimal letter spacing of the target elements.</td>
        <td><code>false</code></td>
        <td><code>true</code> | <code>false</code></td>
    </tr>
    
    <tr>
        <td colspan="4"><strong>Truncation</strong></td>
    </tr>
    <tr>
        <td><code>truncate</code></td>
        <td>Truncation will strip inline content from the target element(s) that would overflow in the current fit direction. When <code>fitDirection</code> is <code>'horizontal'</code> and truncation is enabled, word wrapping will not occur.</td>
        <td><code>true</code></td>
        <td><code>true</code> | <code>false</code></td>
    </tr>
    <tr>
        <td><code>truncateString</code></td>
        <td>The HTML content inserted at the truncation location when truncation occurs.</td>
        <td><code>'&amp;hellip;'</code></td>
        <td>string</td>
    </tr>
    <tr>
        <td><code>truncateLocation</code></td>
        <td>The location within the inline content to strip from the target element(s).</td>
        <td><code>'end'</code></td>
        <td><code>'start'</code> | <code>'middle'</code> | <code>'end'</code></td>
    </tr>
    <tr>
        <td><code>truncateOnlyWholeWords</code></td>
        <td>Truncation will be limited to white space so that whole words are retained.</td>
        <td><code>false</code></td>
        <td><code>true</code> | <code>false</code></td>
    </tr>
</table>

### Notes  
- Content will be wrapped in a <code>&lt;span&gt;</code> element, which could adversely affect any direct-child selectors.
- Whole-word truncation is preferred over letter spacing adjustment, when possible.