// A lightweight js kit for testing


class JzKitDom
{
    /**
    * @param {string} selector - A css selector
    */
    first(selector) {
        switch (typeof selector) {
            case "string": return document.querySelector(selector);
        }
    }
    /**
    * @param {string} selector - A css selector
    */
   select(selector) {
        switch (typeof selector) {
            case "string": return document.querySelectorAll(selector);
        }
    }
    /**
     * @param  {string} formSelector
     * @param  {Function} mapAction
     */
    form(formSelector,mapAction) {
        const self = this;
        const formElement = self.first(formSelector);
        return mapAction(function(inputSelector) {
            const inputElement = formElement.querySelector(inputSelector);
            if (!inputElement) throw Error("Missing requested input element '"+inputSelector+"'");
            return inputElement ? inputElement.value : null;
        });
    }
    /*
    htmlOf(node) {
        if (typeof node === "undefined") throw "parameter is undefined";
        if (!(node instanceof Node)) throw "parameter is not a node";
        switch (node.nodeType)
// nodeType     Node type	            nodeName returns        nodeValue returns
// 1	        Element                 element name	        null

// 2	        Attr                    attribute name	        attribute value

// 3	        Text                    #text       	        content of node

// 4	        CDATASection            #cdata-section	        content of node

// 5	        EntityReference         entity reference name	null

// 6	        Entity                  entity name             null

// 7	        ProcessingInstruction   target      	        content of node

// 8	        Comment                 #comment        	    comment text

// 9	        Document                #document        	    null

// 10	        DocumentType            doctype name	        null

// 11 	        DocumentFragment        #document fragment	    null

// 12	        Notation                notation name           null

        return node.innerHTML;
    }// */
}
class JzKitHttp {
    get(url) {
        return {
            /**
             * @returns {Promise}
             */
            get then() { return (action) => fetch(url, { method:'GET'}).then(action); },
            /**
             * @returns {Promise}
             */
            get catch() { return (action) => fetch(url, { method:'GET'}).catch(action); },
            /**
             * @returns {Promise}
             */
            get finally() { return (action) => fetch(url, { method:'GET'}).finally(action); },
            /**
             * @returns {Promise}
             */
            get json() { return (action) => fetch(url, { method:'GET'}).then(response=>response.json()).then(action); },
            /**
             * @returns {Promise}
             */
            get script() {
                return (action) => new Promise(function(resolve, reject) {
                    const element = document.createElement('script');
                    element.onload = function () { resolve(element); };
                    element.src = url;
                    document.body.appendChild(element);
                }).then(then);
            },
            /**
             * @returns {Promise}
             */
            get style() {
                return (action) => new Promise(function(resolve, reject) {
                    const element = document.createElement('link');
                    element.onload = function () { resolve(element); };
                    element.rel = 'stylesheet';
                    element.href = url;
                    document.body.appendChild(element);
                }).then(then);
            }
        }
    }
}
class JzKitContentAudio {
    load(url, alias = null) {
        if (alias === null) alias = url;
        const samples = this.samples;
        if (samples && samples[alias]) {
            samples[alias].stop();
            samples[alias] = null;
        }
        if (url === null || url === undefined) return;
        const obj = this.samples[alias] = new Audio(url);
        obj.autoplay = false;
    }
    cue(alias) {
        const samples = this.samples;
        if (!samples) throw "no samples loaded";
        const sample = samples[alias];
        if (!sample) throw "unknown audio sample alias "+alias;
        sample.play();
    }
    stop(alias) {
        const samples = this.samples;
        if (!samples) return;
        const sample = samples[alias];
        if (!sample) return;
        sample.stop();
    }
}
class JzKitContent {
    static audioContent = new JzKitContentAudio();
    get load() {
        const self = this;
        return {
            audio: self.audioContent.load,
        }
    }
    cue(sampleAlias) {
        this.audioContent.cue(sampleAlias);
    }
}
class JzKitType {
    static exists(identifier = null) {
        return !(typeof identifier === "undefined");
    }
    get exists() { return () => JzKitType.exists; }

    static ensure(identifier, definitionAction) {
        if (JzKitType.exists(identifier)) return;
        definitionAction();
    }
    get ensure() { return () => JzKitType.ensure; }
}

class JzKitMathExtensions {
    static clamp(s,a=0,b=1) {
        if (a > b) b = [a, a = b][0];
        return s <= a ? a
             : s >= b ? b
             : s;
    }
    get clamp() { return () => JzKitType.clamp; }
    static lerp(s,a=0,b=1) { return a+s*(b-a); }
    get lerp() { return () => JzKitType.lerp; }
    static smoothstep(s,a=0,b=1) {
        s = clamp(s);
        s =  s * s * s * (s * (s * 6 - 15) + 10);
        return lerp(s,a,b);
    }
    get smoothstep() { return () => JzKitType.smoothstep; }

    static Polyfill() {
        JzKitType.ensure(Math.clamp, ()=> Math.clamp = JzKitMathExtensions.clamp);
        JzKitType.ensure(Math.lerp, ()=> Math.lerp = JzKitMathExtensions.lerp);
        JzKitType.ensure(Math.smoothstep, ()=> Math.smoothstep = JzKitMathExtensions.smoothstep);
    }
}

class JzKit
{
    constructor() {
        this.math = new JzKitMathExtensions();
        this.type = new JzKitType();
        this.dom = new JzKitDom();
        this.http = new JzKitHttp();
        this.content = new JzKitContent();
    }
    private(action) {
        action(this);
    }
};
