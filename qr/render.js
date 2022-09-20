function convertImage(img, metadata) {
  "use strict";

  const each=(obj, fn)=>{
    var length = obj.length,
        i = 0,
        likeArray = length === 0 || (length > 0 && length - 1 in obj);

    if (likeArray) {
      for (; i < length; i++) {
        if (fn.call(obj[i], i, obj[i]) === false) break;
      }
    } else {
      for (i in obj) {
        if (fn.call(obj[i], i, obj[i]) === false) break;
      }
    }
  }

  const toHex=(v)=>Number(v).toString(16);
  const padHex=(c)=>c>15 ? toHex(c) : "0" + toHex(c);

  const getColor=(r, g, b, a)=>{
    a = parseInt(a);
    switch(true) {
      case a === undefined || a === 255: return "#" + padHex(r) + padHex(g) + padHex(b);
      case a === 0: return false;
      default: return `rgba(${r},${g},${b},${a/255.0})`;
    }
  }

  const makePathData=(x, y, w)=>`M${x} ${y}h${w}`;
  const makePath=(color,data)=>`<path stroke="${color}" d="${data}"/>\n`;
  
  function colorsToPaths(colors) {
    var output = "";

    // Loop through each color to build paths
    each(colors, function (color, values) {
      color = getColor.apply(null, color.split(","));

      if (color === false) {
        return;
      }

      var paths = [];
      var curPath;
      var w = 1;

      // Loops through each color's pixels to optimize paths
      each(values, function () {
        if (curPath && this[1] === curPath[1] && this[0] === curPath[0] + w) {
          w++;
          return;
        }
        if (curPath) {
          paths.push(makePathData(curPath[0], curPath[1], w));
          w = 1;
        }
        curPath = this;
      });

      paths.push(makePathData(curPath[0], curPath[1], w)); // Finish last path
      output += makePath(color, paths.join(""));
    });

    return output;
  }

  var getColors = function (img) {
    const colors = {},
        data = img.data,
        w = img.width;

    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] <= 0) continue;
      const [a,b,c,d]=data.slice(i,i+3);
      const color =`${a},${b},${c},${d}`;
      colors[color] = colors[color] || [];
      const x = (i / 4) % w;
      const y = Math.floor(i / 4 / w);
      colors[color].push([x, y]);
    }

    return colors;
  };

  var window = window || {};
  window.CP = {
    shouldStopExecution: function () {
      return false;
    },
    exitedLoop: function () {},
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 ${img.width} ${img.height}" shape-rendering="crispEdges">\n<metadata>${metadata}</metadata>\n${colorsToPaths(getColors(img))}</svg>`;
}

const qrForm = document.getElementById("qr-parameters");

var qrCode = {
  gen: null,
  div: {
    img: document.getElementById("qrcode-img"),
    svg: document.getElementById("qrcode-svg"),
  },
};
async function handleSave(data, types, callback) {
  return true;
  
  if (!callback) callback = (r) => r.blob();
  if (!window.showSaveFilePicker) {
    console.log("file picker unavailable");
    return true;
  }
  const handle = await showSaveFilePicker({
    types:
      types ||
      [
        // {
        //     description: 'Text file',
        //     accept: {'text/plain': ['.txt']},
        // }
      ],
  });
  if (data instanceof HTMLAnchorElement) {
    data = await fetch(data.href).then(callback);
  }
  const writable = await handle.createWritable();
  await writable.write(data);
  writable.close();
  return false;
}

const fileTypes = {
  svg: {
    description: "SVG image",
    accept: { "image/svg+xml": [".svg"] },
  },
  png: {
    description: "PNG image",
    accept: { "image/png": [".png"] },
  },
};
function saveSvgLink(svg) {
  onClickExpression = `handleSave(this,[${JSON.stringify(
    fileTypes.svg
  ).replaceAll('"', "'")}],r=>r.text())`;
  return `<a href="data:image/svg+xml,${encodeURIComponent(
    svg
  )}" onclick="return ${onClickExpression};" download="qrcode.svg">${svg}</a>`;
}
function generate() {
  let parameters = Object.fromEntries(new FormData(qrForm).entries());
  parameters.height = parameters.width = Number(parameters.width);
  parameters.correctLevel = QRCode.CorrectLevel[parameters.correctLevel];
  qrCode.div.img.innerHTML = "";
  qrCode.gen = new QRCode(qrCode.div.img, parameters);
  const img = qrCode.gen._oDrawing._oContext.getImageData(
    0,
    0,
    parameters.width,
    parameters.height
  );
  const svg = convertImage(img, parameters.text);
  qrCode.div.svg.innerHTML = saveSvgLink(svg);
  qrCode.div.svg.style.width = (parameters.width || 0) + "px";
  return parameters;
}
