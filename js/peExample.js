/**
* This is an App Example
* Be comfortable to copy, modity or extends it
*/
class PEApp {
	constructor(container, width, height) {
		// Graphics:
		this.cvs = document.createElement("canvas");
		this.cvs.width = width || window.innerWidth - 48;
		this.cvs.height = height || window.innerHeight - 48;
		if (container) {
			container.appendChild(this.cvs);
		} else {
			document.body.appendChild(this.cvs);
		}
        this.ctx = this.cvs.getContext("2d");
		// Data:
		this.randoms = new Array(100),
		this.randomI = 0,
		this.temp = [0];
		this.levelData = undefined;
		this.scoreData = undefined;
		// State and options:
		this.state = "loading";
        this.renderOnTick = true;
        this.showInfo = true;
		this.animRequest = null;
		this.paused = false;
		this.pausedAt = 0;
		// The physics engine:
		this.physics = new PEPhysics();
		// Textures:
		//Modify it:
		this.textureCount = 12;
		this.textures = {
			loading: Texture.fromSource("assets/loading.png"),
			intro: Texture.fromSource("assets/intro.png"),
			ending: Texture.fromSource("assets/loading.png"),
			circle1: Texture.fromSource("assets/circ1.png"),
			circle2: Texture.fromSource("assets/circ2.png"),
			circle3: Texture.fromSource("assets/circ3.png"),
			rect: Texture.fromSource("assets/rect.png"),
			poly3: Texture.fromSource("assets/poly3.png"),
			poly4: Texture.fromSource("assets/poly4.png"),
			poly5: Texture.fromSource("assets/poly5.png"),
			poly6: Texture.fromSource("assets/poly6.png"),
			other: Texture.fromSource("assets/other.png")
		};
        // Call first tick:
		window.requestAnimationFrame(this.handleTick.bind(this));
	}
	/**
	* Get random number from collection
	*/
	get nextRandom() {
		this.randomI++;
		if (this.randomI >= this.randoms.length) {
			this.randomI = parseInt(Math.random() & 9);
		}
		return this.randoms[this.randomI];
	}
	// Game loop:
	initialize () {
		// You can setting the physics engine here:
		this.physics.width = this.cvs.width;
		this.physics.height = this.cvs.height;
		/*		
		this.physics.gravity = new Vec2(0, 10);
        this.physics.wind = new Vec2(0, 0);
        this.physics.itter = 15;
		this.physics.flagCheckOutbound = true;
        this.physics.flagCorectPos = true;
        this.physics.flagMove = true;
        this.physics.timeFactor = 0.006;
		*/
		// create fixed randoms to make faster:
		this.randoms[17] = Math.random();
		for (let i = 0; i < this.randoms.length; i++) {
			this.randoms[i] = Math.random();
		}
		// create some static-bodies:
		let centerX = this.cvs.width / 2, centerY = this.cvs.height / 2;
		this.levelData = {
			gameOver: false,
			ground : this.createRectangle(0, 0, centerX, 40, 0, 0.2, 0.5),
			ball : this.createCircle(0, 0, 50, 0, 0.2, 0.8),
			barL : this.createRectangle(0, 0, 300, 20, 0, 0.2, 0.8),
			barR : this.createRectangle(0, 0, 300, 20, 0, 0.5, 0.5),
			pent : this.createPerfectPolygon(0, 0, 75, 5, 0, 0.2, 0.5)
		};
		// set textures:
		this.levelData.ground.style.backgroundColor = "#225522";
		this.levelData.ball.textureId = "circle3";
		this.levelData.barL.textureId = "rect";
		this.levelData.barR.textureId = "rect";
		this.levelData.pent.textureId = "poly5";
		// We can rotate manually:
		this.levelData.barL.rotate(Math.PI / 8);
		this.levelData.barR.rotate(-Math.PI / 18);
		// Set position manually:
		// You can not set x and y position as other app
		// It's complex for polygon with vertice. Do like this:
		this.levelData.ground.position = new Vec2(centerX, 2 * centerY - 20);
		this.levelData.barR.position = new Vec2(centerX * 1.5, centerY);
		this.levelData.barL.position = new Vec2(centerX * 0.5, centerY);
		this.levelData.ball.position = new Vec2(centerX * 1.1, centerY * 0.5);
		this.levelData.pent.position = new Vec2(centerX * 0.7, centerY * 0.5);
		// Init Events:
		this.cvs.addEventListener("click", this.handleClick.bind(this));
		/*
		this.cvs.addEventListener("mousedown", this.handleMouseDown.bind(this));
		this.cvs.addEventListener("mouseup", this.handleMouseUp.bind(this));
		this.cvs.addEventListener("mousemove", this.handleMouseMove.bind(this));
		this.cvs.addEventListener("tap", this.handleClick.bind(this));
		this.cvs.addEventListener("touchdown", this.handleMouseDown.bind(this));
		this.cvs.addEventListener("touchup", this.handleMouseUp.bind(this));
		this.cvs.addEventListener("touchmove", this.handleMouseMove.bind(this));
		this.cvs.addEventListener("keydown", this.handleKeyDown.bind(this));
		this.cvs.addEventListener("keyup", this.handleKeyUp.bind(this));
		*/
		window.addEventListener("resize", this.resize.bind(this));
		// Next state:
		this.state = "intro";
		let im = this.textures.intro.image;
		this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
		this.ctx.drawImage(
			im,
			(this.cvs.width - im.width) * 0.5,
			(this.cvs.height - im.height) * 0.5
		);
	}
	playLoading() {
		// draw loading sign:
		let cx = 0.5 * this.cvs.width,
		cy = 0.5 * this.cvs.height,
		tex = this.textures.loading;
		this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
		this.ctx.save();
		this.ctx.translate(cx, cy);
		this.ctx.rotate(Math.PI / 180 * tex.frame);
		if (tex.ready) {
			let im = tex.image;
			this.ctx.drawImage(im, -im.width * 0.5, -im.height * 0.5);
		} else {
			this.ctx.beginPath();
			this.ctx.arc(cx, cy, 64, 0, Math.PI * 2);
			this.ctx.closePath();
			this.ctx.fill();
			this.ctx.stroke();
			this.ctx.beginPath();
			this.ctx.moveTo(cx, cy);
			this.ctx.lineTo(cx, cy - 64);
			this.ctx.stroke();
		}
		this.ctx.restore();
		// update rotation:
		tex.frame = (tex.frame == 177) ? -180 : tex.frame + 3;
		// check textures:
		let numLoaded = 0;
		for (let s in this.textures) {
			if (this.textures[s].ready) {
				numLoaded++;
			}
		}
		if (numLoaded == this.textureCount) {
			this.initialize();
		}
	}
	playIntro() {
		// May be you have animation or buttons
	}
	playMain() {
		this.physics.update();
		if (this.levelData.gameOver) {
			this.endLevel();
			return;
		}
		this.render();
		
		//modify it:
		// update something
		this.levelData.pent.rotate(-Math.PI / 50);
		this.levelData.pent.updateNormals();
		// change the wind
		if (this.physics.lastTime % 3000 < 5) {
			this.physics.wind.x = parseInt((this.nextRandom - 0.5) * 8);
		}
		// create more dynamics
		this.randoms[this.randomI] = Math.random();
		let i = parseInt(this.randoms[this.randomI] * 50);
		
		if (i < 4) {
			let ww = this.cvs.width * 0.75,
			centerX = this.cvs.width / 2,
			x = this.nextRandom * ww + centerX / 4,
			y = -this.nextRandom * 100,
			w = this.nextRandom * 20 + 20,
			h = this.nextRandom * 20 + 20,
			density = 1,
			mass = 0,
			friction = 0.2,
			restitution = 0.5,
			o;
			if (i == 0) {
				o = this.createRectangle(x, y, w, h, density, friction, restitution);
				o.textureId = "rect";
				o.style.borderStyle = "none";
				o.aVelocity = (this.nextRandom - 0.5) * 10;
			} else if (i == 1) {
				o = this.createCircle(x, y, w, density, friction, restitution);
				o.textureId = "circle1";
				o.style.borderStyle = "none";
			} else if (i == 2) {
				o = this.createCircle(x, y, w, density, friction, restitution);
				o.textureId = "circle2";
			} else if (i == 3) {
				let segment = parseInt(this.nextRandom * 6 + 3);
				o = this.createPerfectPolygon(x, y, w, segment, density, friction, restitution);
				o.textureId = segment > 6 ? "other" : ("poly" + segment);
			}
		}
	}
	playEnding() {
		// May be you have animation or buttons
	}
	render() {
		// Modify it:
        if (this.renderOnTick || this.needDraw) {
			this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height);
			this.ctx.strokeStyle = "#ccccff";
			// draw bodies:
			let ar = this.physics.bodies,
			i = 0, o;
			do {
				o = ar[i];
				o.draw(this.ctx, this.textures[o.textureId]);
				i++;
			} while (i < ar.length);
			// draw info:
			if (this.showInfo) {
				this.ctx.textAlign = "left";
				this.ctx.font = "bold 14px verdana";
				this.ctx.fillStyle = "#000000";
				this.ctx.fillText("Gravity: " + this.physics.gravity.y + "  Wind: " + this.physics.wind.x, 10, 10);
			}
			this.needDraw = false;
		}
    }
	// Event handler:
	handleTick() {
		switch (this.state) {
			case "main":
				this.playMain();
				break;
			case "intro":
				this.playIntro();
				break;
			case "ending":
				this.playEnding();
				break;
			case "loading":
				this.playLoading();
				break;
			case "initialize":
				this.playLoading();
				break;
			default:
				break;
		}
		window.requestAnimationFrame(this.handleTick.bind(this));
	}
	handleKeyDown (e) {}
	handleKeyUp (e) {}
	handleMouseDown(e) {}
	handleMouseMove(e) {}
	handleMouseUp(e) {}
	handleClick(e) {
		// Modify it:
		if (this.state == "intro" || this.state == "ending") {
			this.startLevel();
		}
	}
	// Helper:
	createTexture(src, frames, clip) {
        this.textures.push(Texture.fromSource(src, frames, clip));
        return this.textures.length - 1;
    }
    createCircle(x, y, radius, density, friction, restitution) {
        let mass = PEPhysics.calculateCircleMass(density, radius);
		let o = new PECircle(new Vec2(x, y), radius, mass, friction, restitution);
        this.physics.addBody(o);
        return o;
    }
    createPolygon(x, y, geom, density, friction, restitution) {
		let mass = PEPhysics.calculatePolygonMass(density, geom);
        let o = new PEPolygon(new Vec2(x, y), verts, mass, friction, restitution);
        this.physics.addBody(o);
        return o;
    }
    createPerfectPolygon(x, y, radius, segment, density, friction, restitution) {
        segment = Math.max(3, segment);
        let geom = [],
        delta = Math.PI * 2 / segment,
        start = -Math.PI / 2,
        a;
        for (let i = 0; i < segment; i++) {
            a = i * delta + start;
            geom.push(new Vec2(Math.cos(a) * radius, Math.sin(a) * radius));
        }
		let mass = PEPhysics.calculatePolygonMass(density, geom);
        let o = new PEPolygon(new Vec2(x, y), geom, mass, friction, restitution);
        this.physics.addBody(o);
        return o;
    }
    createRectangle(x, y, w, h, density, friction, restitution) {
		let mass = PEPhysics.calculateRectangleMass(density, w, h, w);
        let w2 = w / 2,
        h2 = h / 2;
        let geom = [new Vec2( - w2,  - h2), new Vec2( + w2,  - h2), new Vec2( + w2,  + h2), new Vec2( - w2,  + h2)];
        let o = new PEPolygon(new Vec2(x, y), geom, mass, friction, restitution);
        this.physics.addBody(o);
        return o;
    }
	// Main methods:
	endLevel() {
		// Modify it:
		this.state = "ending";
		let im = this.textures.ending.image;
		this.ctx.clear(0, 0, this.cvs.width, this.cvs.height);
		this.ctx.drawImage(
			im,
			(this.cvs.width - im.width) * 0.5,
			(this.cvs.height - im.height) * 0.5
		);
	}
	startLevel() {
		// Modify it
		this.physics.lastTime = Date.now();
		this.state = "main";
	}
	resize(e) {
		this.cvs.width = window.innerWidth - 48;
		this.cvs.height = window.innerHeight - 48;
		this.physics.resize(this.cvs.width, this.cvs.height);
	}
    start () {
		if (this.paused) {
			this.paused = false;
            this.physics.lastTime += (Date.now() - this.pausedAt);
		} else {
			this.physics.lastTime = Date.now();
		}
	}
	stop(pause) {
		if (this.animRequest) {
            window.cancelRequestAnimationFrame(this.animRequest);
            this.animRequest = null;
        }
		if (pause) {
			this.pausedAt = Date.now();
			this.paused = true;
		} else {
			this.endLevel();
		}
	}
}