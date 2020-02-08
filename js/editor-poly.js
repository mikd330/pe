class PEPolygonEditor {
	constructor() {
		this.iFile = document.getElementById("i-file");
		this.iMass = document.getElementById("i-mass");
		this.iFric = document.getElementById("i-fric");
		this.iRest = document.getElementById("i-rest");
		this.iZoom = document.getElementById("i-zoom");
		this.bClear = document.getElementById("b-clear");
		this.bDele = document.getElementById("b-dele");
		this.bSave = document.getElementById("b-save");
		this.cvs = document.getElementById("cvs");
		this.ctx = this.cvs.getContext("2d");
		this.image = undefined;
		this.data = {
			center: {x:this.cvs.width * 0.5, y:this.cvs.height * 0.5},
			points: []
		};
		this.POINT_RADIUS = 4;
		this.CENTER_COLOR = "#00ff00";
		this.POINT_COLOR = "#CCCC00";
		this.mouseX = 0;
		this.mouseY = 0;
		this.drag = false;
		this.dragPoint = null;
		this.needDraw = false;
		
		this.cvs.addEventListener("dblclick", this.dblClick.bind(this));
		this.cvs.addEventListener("mousedown", this.msDown.bind(this));
		this.cvs.addEventListener("mousemove", this.msMove.bind(this));
		this.cvs.addEventListener("mouseup", this.msUp.bind(this));
		
		this.bClear.addEventListener("click", function clearClick (e) {
			this.data.points.length = 0;
		});
		this.bDele.addEventListener("click", this.deleClick.bind(this));
		this.bSave.addEventListener("click", this.saveClick.bind(this));
		
		this.iFile.onchange = this.iFileChange.bind(this);
		this.iZoom.onchange = this.drawImage.bind(this);
		
		
		this.updateCanvas();
	}
	iFileChange () {
		let file = this.iFile.files[0];
		if (file) {
			let fr = new FileReader();
			let im = new Image();
			im.onload = this.imageLoaded.bind(this);
			fr.onload = ((e) => {
				if (fr.result) {
					im.src = fr.result;
				} else {
					alert("File not found");
				}
				fr.onload = null;
			}).bind(this);
			fr.readAsDataURL(file);
		}
	}
	imageLoaded (e) {
		this.image = null;
		this.image = e.target;
		this.image.onload = null;
		this.data.center.x = this.image.width * 0.5;
		this.data.center.y = this.image.height * 0.5;
		this.data.points.length = 0;
		this.needDraw = true;
	}
	updateMouse(e) {
		let r = this.cvs.getBoundingClientRect();
		this.mouseX = e.clientX - r.x;
		this.mouseY = e.clientY - r.y;
	}
	draw() {
		if (this.image) {
			this.drawImage();
			this.drawPoint(this.data.center, this.CENTER_COLOR);
			if (this.data.points.length > 0) {
				if (this.data.points.length > 1) {
					this.drawPoly();
				}
				this.drawPoints();
			}
		}
	}
	drawImage() {
		let zoom = Number(this.iZoom.value);
		if (!zoom) {
			zoom = 1;
		} else {
			zoom *= 0.01;
		}
		this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
		this.ctx.save();
		if (zoom != 1) {
			this.ctx.scale(zoom, zoom);
		}
		this.ctx.drawImage(this.image, 0, 0);
		this.ctx.restore();
	}
	drawPoint(p, color) {
		this.ctx.beginPath();
		this.ctx.arc(p.x, p.y, this.POINT_RADIUS, 0, Math.PI * 2);
		this.ctx.closePath();
		this.ctx.fillStyle = color;
		this.ctx.fill();
		this.ctx.stroke();
	}		
	drawPoints () {
		for (let i = 0; i < this.data.points.length; i++) {
			this.drawPoint(this.data.points[i], this.POINT_COLOR);
		}
	}
	drawPoly() {
		this.ctx.beginPath();
		this.ctx.moveTo(this.data.points[0].x, this.data.points[0].y);
		for (let i = 1; i < this.data.points.length; i++) {
			this.ctx.lineTo(this.data.points[i].x, this.data.points[i].y);
		}
		this.ctx.closePath();
		this.ctx.strokeStyle = "#ff0000";
		this.ctx.stroke();
	}
	dblClick (e) {
		this.updateMouse(e);
		let p = {x:this.mouseX, y:this.mouseY};
		this.data.points.push(p);
		this.needDraw = true;
	}
	clearClick (e) {
		this.data.points.length = 0;
		this.needDraw = true;
	}
	deleClick(e) {
		if (this.dragPoint) {
			let i = this.data.points.indexOf(this.dragPoint);
			this.data.points.splce(i, 1);
			this.dragPoint = null;
			this.needDraw = true;
		}
	}
	saveClick(e) {
		this.data.mass = Number(this.iMass.value);
		this.data.friction = Number(this.iFric.value);
		this.data.restitution = Number(this.iRest.value);
		let s = JSON.stringify(this.data);
		let a = document.createElement("a");
		a.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(s));
		a.setAttribute('download', 'polygon.json');
		a.click();
		
	}
	isPointAtMouse(p) {
		return (Math.abs(p.x - this.mouseX) < 8 && Math.abs(p.y - this.mouseY) < 8); 
	}
	msDown(e) {
		this.updateMouse(e);
		let p = this.isPointAtMouse(this.data.center) ? this.data.center : null;
		if (!p) {
			for (let i = 0; i < this.data.points.length; i++) {
				if (this.isPointAtMouse(this.data.points[i])) {
					p = this.data.points[i];
					break;
				}
			}
		}
		if (p) {
			this.drag = true;
			this.dragPoint = p;
			this.needDraw = true;
		}
	}
	msMove (e) {
		if (this.drag) {
			this.updateMouse(e);
			this.dragPoint.x = this.mouseX;
			this.dragPoint.y = this.mouseY;
			this.needDraw = true;
		}
	}
	msUp (e) {
		if (this.drag) {
			this.drag = false;
		}
	}
	updateCanvas() {
		if (this.needDraw) {
			this.draw();
			this.needDraw = false;
		}
		window.requestAnimationFrame(this.updateCanvas.bind(this));
	}
}
window.onload = function(e) {
	
	
	let E = new PEPolygonEditor();
};