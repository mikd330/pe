class Rect {
    constructor(x, y, w, h) {
        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 0;
        this.h = h || 0;
    }
}
class Vec2 {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    get lengthSquare() {
        return this.x * this.x + this.y * this.y;
    }
    sets(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    add(v) {
        return new Vec2(v.x + this.x, v.y + this.y);
    }
    addSelf(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    clone() {
        return new Vec2(this.x, this.y);
    }
    copyFrom(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    distance(v) {
        let dx = this.x - v.x,
        dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
	dot(v) {
        return this.x * v.x + this.y * v.y;
    }
	normalize() {
        let n = this.length;
        return (n == 0 || n == 1) ? this.clone() : this.scale(1 / n);
    }
    normalizeSelf() {
        let n = this.length;
        return (n == 0 || n == 1) ? this : this.scaleSelf(1 / n);
    }
	rotate(v, a) {
        let dx = this.x - v.x,
        dy = this.y - v.y,
        c = Math.cos(a),
        s = Math.sin(a);
        return new Vec2(
            dx * c - dy * s + v.x,
            dx * s + dy * c + v.y);
    }
    rotateSelf(v, a) {
        let dx = this.x - v.x,
        dy = this.y - v.y,
        c = Math.cos(a),
        s = Math.sin(a);
        this.x = dx * c - dy * s + v.x;
        this.y = dx * s + dy * c + v.y;
        return this;
    }
    scale(n) {
        return new Vec2(this.x * n, this.y * n);
    }
    scaleSelf(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }
	sub(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    }
    subSelf(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
	static copyPointsA2B(a, b) {
        let i = 0, vl = a.length;
		do {
            if (b[i]) {
                b[i].x = a[i].x;
                b[i].y = a[i].y;
            } else {
                b[i] = a[i].clone();
            }
			i++;
        } while (i < vl);
        return b;
    }
    static rotatePoints(angle, points, centerX, centerY) {
        centerX = centerX || 0;
        centerY = centerY || 0;
        let c = Math.cos(angle),
        s = Math.sin(angle),
		i = 0,
		vl = points.length,
        dx,
        dy;
        do {
            dx = points[i].x - centerX;
            dy = points[i].y - centerY;
            points[i].x = dx * c - dy * s + centerX;
            points[i].y = dx * s + dy * c + centerY;
			i++;
        } while (i < vl);
        return points;
    }
    static scalePoints(scaleX, scaleY, points) {
        let i = 0; vl = points.length;
		do {
            points[i].x *= scaleX;
            points[i].y *= scaleY;
			i++;
        } while ( i < vl);
        return points;
    }
}
class Style {
    constructor() {
        this.backgroundColor = "#090761";
        this.borderColor = "#bbbbbb";
        this.borderWidth = 1;
        this.borderStyle = "solid";
    }
}
class Texture {
    constructor(image, frames, clip) {
        this.image = image;
        this.frames = frames || [];
		this.frame = 0;
        this.clip = clip || true;
        this.ready = true;
    }
    get rect() {
        return this.ready ? this.frames[this.currentFrame] : null;
    }
    getRect(i) {
        return this.frames[i];
    }
    static fromSource(src, frames, clip) {
        let ret = new Texture(new Image(), frames, clip);
        ret.ready = false;
        ret.image.onload = (e) => {
            if (ret.frames.length == 0) {
                ret.frames[0] = new Rect(0, 0, ret.image.width, ret.image.height);
            }
            ret.ready = true;
            ret.image.onload = null;
        };
        ret.image.src = src;
        return ret;
    }
}
class PEBody {
    constructor(pos, mass, friction, restitution) {
        this.id = PEBody.getID();
        this.name = this.id.toString();
        this.type = PEBody.UNKNOWN;
		this.data = null;
        this.storeCollision = false;
		this.collisionList = [];
		this.virtual = false;
        this.originRect = new Rect();
        this.pos = pos;
        this.inertia = 0;
        this.iMass = !mass ? 0 : mass > 0 ? 1 / mass : 0;
        this.friction = friction ? friction : 0.8;
        this.restitution = restitution ? restitution : 0.2;
        this.acceleration = new Vec2(0, 0);
		this.aAcceleration = 0;
        this.velocity = new Vec2(0, 0);
		this.aVelocity = 0;
        this.rotation = 0;
        this.boundRadius = 0;
        this.textureId = 0;
        this.textureFrameId = 0;
        this.style = new Style();
    }
    static UNKNOWN = 0;
    static CIRCLE = 1;
    static POLYGON = 2;
	static counter = 0;
    static getID() {
        if ((this.counter + 2) == Number.MAX_VALUE) {
            this.counter = 0;
        }
        return this.counter++;
    }
    get isStatic() {
        return this.iMass === 0;
    }
    get position() {
        return this.pos.clone;
    }
    set position(p) {
        this.move(p.sub(this.pos));
    }
    collideWith(b) {
		if (this.storeCollision) {
			this.collisionList.push(b);
		}
	}
	dispose() {
		this.collisionList.length = 0;
	}
    draw(ctx, tex) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);
        if (tex && tex.ready) {
            if (tex.clip) {
                this.drawGeom(ctx);
                ctx.clip();
            }
			let rt = tex.getRect(this.textureFrameId),
            ro = this.originRect;
            ctx.drawImage(tex.image, rt.x, rt.y, rt.w, rt.h, ro.x, ro.y, ro.w, ro.h);
        } else {
            this.drawGeom(ctx);
            ctx.fillStyle = this.style.backgroundColor;
            ctx.fill();
            if (this.style.borderStyle == "solid") {
                ctx.strokeStyle = this.style.borderColor;
                ctx.lineWidth = this.style.borderWidth;
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    drawGeom(ctx) {}
    equal(o) {
        return this.id === o.id;
    }
    move(t) {
        this.pos.addSelf(t);
    }
    rotate(angle) {
        this.rotation += angle;
    }
    updateInertia() {}
    updateMass(n) {
        let m = this.iMass == 0 ? 1 / this.iMass : 0;
        if ((m += n) <= 0) {
            this.iMass = 0;
            this.velocity.x = this.velocity.y = 0;
            this.acceleration.a = this.acceleration.y = 0;
            this.aVelocity = 0;
            this.aAcceleration = 0;
        } else {
            this.iMass = 1 / m;
        }
        this.updateInertia();
    }
	applyImpulse(impulse, contactVector) {
		this.velocity.addSelf(impulse.scale(this.iMass));
		this.aVelocity.addSelf(contactVector.cross(impulse).scale(this.inertia));
	}
}
class PECircle extends PEBody {
    constructor(pos, radius, mass, friction, restitution) {
        super(pos, mass, friction, restitution);
        this.bodyType = PEBody.CIRCLE;
        this.originRect.x = this.originRect.y = -radius;
        this.originRect.w = this.originRect.h = 2 * radius;
        this.radius = radius;
        this.boundRadius = radius;
        this.startpoint = new Vec2(pos.x, pos.y - radius);
        this.updateInertia();
    }
    calculateMass(density) {
		let mass = densi
	}
	drawGeom(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, 2 * Math.PI, !0);
        ctx.closePath();
    }
    updateInertia() {
        if (this.iMass == 0) {
            this.inertia = 0;
        } else {
            this.inertia = 1 / this.iMass * (this.radius * this.radius) / 12;
        }
    }
}
class PEPolygon extends PEBody {
    constructor(pos, verts, mass, friction, restitution) {
        super(pos, mass, friction, restitution);
        this.bodyType = PEBody.POLYGON;
        this.width = 0;
        this.height = 0;
        this.boundRadius = 0;
        this.origin = [];
        this.vertice = [];
        this.fNormal = [];
        if (verts) {
            this.setVertice(verts);
        }
    }
    setVertice(a) {
        this.origin = a;
        let minX = Number.MAX_VALUE,
        minY = Number.MAX_VALUE,
        maxX = Number.MIN_VALUE,
        maxY = Number.MIN_VALUE;
		let i = 0, vl = this.origin.length;
		this.vertice = new Array(vl);
        do {
            this.vertice[i] = this.origin[i].add(this.pos);
            minX = Math.min(minX, this.origin[i].x);
            minY = Math.min(minY, this.origin[i].y);
            maxX = Math.max(maxX, this.origin[i].x);
            maxY = Math.max(maxY, this.origin[i].y);
			i++;
        } while (i < vl);
        this.originRect.x = minX;
        this.originRect.y = minY;
        this.width = this.originRect.w = maxX - minX;
        this.height = this.originRect.h = maxY - minY;
        this.boundRadius = Math.sqrt(this.width * this.width + this.height * this.height) * 0.5;
        this.updateNormals();
        this.updateInertia();
    }
    dispose() {
        this.collisionList.length = this.origin.length = this.vertice.length = this.fNormal.length = 0;
    }
    drawGeom(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.origin[0].x, this.origin[0].y);
		let i = 0, vl = this.origin.length;
        do {
            ctx.lineTo(this.origin[i].x, this.origin[i].y);
			i++;
        } while (i < vl);
        ctx.closePath();
    }
    move(t) {
        this.pos.addSelf(t);
        let i = 0, vl = this.vertice.length;
        do {
            this.vertice[i].x += t.x;
			this.vertice[i].y += t.y;
			i++;
        } while (i < vl);
        return this;
    }
    rotate(angle) {
        this.rotation += angle;
        Vec2.rotatePoints(angle, this.vertice, this.pos.x, this.pos.y);
        this.updateNormals();
    }
    rotateOrigin(angle) {
        let p = Vec2.rotatePoints(angle, this.origin, 0, 0);
        Vec2.copyPointsA2B(p, this.vertice);
        this.updateNormals();
    }
    scaleOrigin(scaleX, scaleY) {
        let p = Vec2.scalePoints(scaleX, scaleY, this.origin);
        Vec2.copyPointsA2B(p, this.vertice);
        this.updateNormals();
    }
    updateInertia() {
        if (this.iMass === 0) {
            this.inertia = 0;
        } else {
            this.inertia = 1 / this.iMass * (this.width * this.width + this.height * this.height) / 12;
            this.inertia = 1 / this.inertia;
        }
    }
    updateNormals() {
        let vl = this.vertice.length,
        i = 0,
        j;
        do {
            j = (i + 1) == vl ? 0 : (i + 1);
            if (this.fNormal[i]) {
                this.fNormal[i].x = this.vertice[j].y - this.vertice[i].y;
                this.fNormal[i].y = this.vertice[i].x - this.vertice[j].x;

            } else {
                this.fNormal[i] = new Vec2(this.vertice[j].y - this.vertice[i].y, this.vertice[i].x - this.vertice[j].x);
            }
            this.fNormal[i].normalizeSelf();
			i++;
        } while (i < vl);
    }
}
class CollisionData {
    constructor() {
        this.depth = 0;
        this.end = new Vec2(0, 0);
        this.normal = new Vec2(0, 0);
        this.start = new Vec2(0, 0);
    }
    setData(d, n, s) {
        this.depth = d;
        this.normal.x = n.x;
        this.normal.y = n.y;
        this.start.x = s.x;
        this.start.y = s.y;
        this.end.x = this.normal.x * this.depth + this.start.x;
        this.end.y = this.normal.y * this.depth + this.start.y;
    }
    setData2(d, nx, ny, sx, sy) {
        this.depth = d;
        this.normal.x = nx;
        this.normal.y = ny;
        this.start.x = sx;
        this.start.y = sy;
        this.end.x = this.normal.x * this.depth + this.start.x;
        this.end.y = this.normal.y * this.depth + this.start.y;
    }
    changeDir() {
        this.normal.x *= -1;
        this.normal.y *= -1;
        let s = this.start;
        this.start = this.end;
        this.end = s;
    }
}
class SupportData {
    constructor() {
        this.point = null;
        this.distance = 0;
    }
}
class PEPhysics {
    constructor(w, h) {
		this.height = w || 600;
		this.width = h || 800;
		this.bodies = [];
		this.gravity = new Vec2(0, 10);
        this.wind = new Vec2(0, 0);
        this.itter = 15;
		this.flagCheckOutbound = true;
        this.flagCorectPos = true;
        this.flagMove = true;
        this.timeFactor = 0.006;
		this.lastTime = 0;
        this.dataS = new SupportData();
        this.dataC = new CollisionData();
        this.dataC1 = new CollisionData;
        this.dataC2 = new CollisionData;
    }
	static PIXEL_TO_METER = 0.01;
	static calculateCircleMass(density, radius) {
		return Math.PI * radius * radius * density * this.PIXEL_TO_METER;
	}
	static calculateRectangleMass(density, w, h, l) {
		l = l || w;
		return w * h * l * density * this.PIXEL_TO_METER;
	}
	static calculatePolygonMass(density, vertice, center) {
		let vol = 0, n = vertice.length, i = 0, j = 1;
		do {
			j = (j + 1) == n ? 0 : (j + 1);
			vol += Math.abs(vertice[i].cross(vertice[j])) * 0.5;
			i++;
		} while (i < vertice.length);
		return density * vol * this.PIXEL_TO_METER;
	}
	addBody(b) {
        let i = this.bodies.indexOf(b);
        if (i < 0) {
            this.bodies.push(b);
        }
        return b;
    }
    removeBody(b) {
        let i = this.bodies.indexOf(b);
        if (i > -1) {
            this.bodies.splice(i, 1);
            b.dispose();
        }
    }
	clearBodies() {
        this.bodies.length = 0;
        this.PEBody.counter = 0;
    }
    broadTest(ba, bb) {
        return ba.pos.distance(bb.pos) <= (ba.boundRadius + bb.boundRadius);
    }
    collision() {
        let data = this.dataC,
        bds = this.bodies,
        bdl = this.bodies.length,
		k = 0,
        j,
        i;
        do {
			j = 0;
            do {
				i = j + 1;
                do {
                    if (this.broadTest(bds[j], bds[i])) {
                        if (this.narrowTest(bds[j], bds[i])) {
							bds[j].collideWith(bds[i]);
							bds[i].collideWith(bds[j]);
							if (!bds[j].virtual && !bds[i].virtual) {
								if (data.normal.dot(bds[i].pos.sub(bds[j].pos)) < 0) {
									data.changeDir();
								}
								this.resolve(bds[j], bds[i]);
							}
                        }
                    }
					i++;
                } while (i < bdl);
				j++;
            } while (j < (bdl-1));
			k++;
        } while (k < this.itter);
    }
    collisionCC(ba, bb) {
        let dp = bb.pos.sub(ba.pos),
        dr = ba.radius + bb.radius;
        let d = dp.length;
        if (d > dr)
            return false;
        if (d == 0) {
            if (ba.radius > bb.radius) {
                this.dataC.setData2(dr, 0, -1, ba.pos.x, ba.pos.y + ba.radius);
            } else {
                this.dataC.setData2(dr, 0, -1, bb.pos.x, bb.pos.y + bb.radius);
            }
        } else {
            let q = dp.scale(-1).normalizeSelf().scaleSelf(bb.radius).addSelf(bb.pos);
            dp.normalizeSelf();
            this.dataC.setData2(dr - d, dp.x, dp.y, q.x, q.y);
        }
        return true;
    }
    collisionPC(ba, bb) {
        let bbp = bb.pos,
        oke = true,
        dst = Number.MIN_VALUE,
        idx = 0,
        d,
        i;
        for (i = 0; i < ba.vertice.length; i++) {
            d = bbp.sub(ba.vertice[i]).dot(ba.fNormal[i]);
            if (d > 0) {
                dst = d;
                idx = i;
                oke = false;
                break;
            }
            if (d > dst) {
                dst = d;
                idx = i;
            }
        }
        let cr;
        if (oke) {
            cr = ba.fNormal[idx].scale(bb.radius);
            this.dataC.setData(bb.radius - dst, ba.fNormal[idx], bbp.sub(cr));
        } else {
            let divider = ba.vertice.length;
            let ab = bbp.sub(ba.vertice[idx]);
            let vv = ba.vertice[(idx + 1) % divider].sub(ba.vertice[idx]);
            let av = ab.dot(vv);
            let al,
            an;
            if (av < 0) {
                al = ab.length;
                if (al > bb.radius) {
                    return false;
                }
                an = ab.normalize();
                cr = an.scale(-bb.radius);
                this.dataC.setData(bb.radius - al, an, bbp.add(cr));
            } else {
                ab = bbp.sub(ba.vertice[(idx + 1) % divider]);
                vv = vv.scale(-1);
                av = ab.dot(vv);
                if (av < 0) {
                    al = ab.length;
                    if (al > bb.radius) {
                        return false;
                    }
                    an = ab.normalize();
                    cr = an.scale(-bb.radius);
                    this.dataC.setData(bb.radius - al, an, bbp.add(cr));
                } else {
                    if (!(dst < bb.radius)) {
                        return false;
                    }
                    cr = ba.fNormal[idx].scale(bb.radius);
                    this.dataC.setData(bb.radius - dst, ba.fNormal[idx], bbp.sub(cr));
                }
            }
        }
        return true;
    }
    collisionPP(ba, bb) {
        let d1 = this.dataC1;
        let d2 = this.dataC2;
        let xa = this.findAxisP(ba, bb, d1);
        let xb = this.findAxisP(bb, ba, d2);
        if (xa && xb) {
            if (d1.depth < d2.depth) {
                let s = d1.normal.scale(d1.depth);
                this.dataC.setData(d1.depth, d1.normal, d1.start.sub(s));
            } else {
                this.dataC.setData(d2.depth, d2.normal.scale(-1), d2.start);
            }
            return true;
        }
        return false;
    }
    findAxisP(ba, bb, data) {
        let supported = true,
        dst = Number.MAX_VALUE,
        idx = null,
        spd,
        i = 0;
        do {
            supported = this.findSupport(bb, ba.fNormal[i].scale(-1), ba.vertice[i], data);
            if (supported && data.distance < dst) {
                idx = i;
                spd = data.point;
                dst = data.distance;
            }
			i++;
        } while (supported && i < ba.fNormal.length);
        if (supported) {
            let dn = ba.fNormal[idx].scale(dst);
            data.setData(dst, ba.fNormal[idx], spd.add(dn));
        }
        return supported;
    }
    findSupport(bb, n, v, dataS) {
        dataS.distance = Number.MIN_VALUE;
        dataS.point = null;
        let i = 0,
		vl = bb.vertice.length,
        d;
        do {
            d = bb.vertice[i].sub(v).dot(n);
            if (d > 0 && d > dataS.distance) {
                dataS.point = bb.vertice[i];
                dataS.distance = d;
            }
			i++;
        } while (i < vl);
        return dataS.point !== null;
    }
    narrowTest(ba, bb) {
        if (ba.bodyType === PEBody.CIRCLE) {
            return bb.bodyType === PEBody.CIRCLE ? this.collisionCC(ba, bb) : this.collisionPC(bb, ba);
        } else {
            return bb.bodyType === PEBody.CIRCLE ? this.collisionPC(ba, bb) : this.collisionPP(ba, bb);
        }
    }
    resolve(ba, bb) {
        if (ba.iMass !== 0 || bb.iMass !== 0) {
            let data = this.dataC;
            let msum = 1 / (ba.iMass + bb.iMass);
            if (this.flagCorectPos) {
                let r = data.normal.scale(data.depth * msum * 0.8);
                ba.move(r.scale(-ba.iMass));
                bb.move(r.scale(bb.iMass));
            }
            let n = data.normal,
            m = data.start.scale(bb.iMass * msum).addSelf(data.end.scale(ba.iMass * msum)),
            a = m.sub(ba.pos),
            b = m.sub(bb.pos),
            va = ba.velocity.add(new Vec2(-1 * ba.aVelocity * a.y, ba.aVelocity * a.x)),
            vb = bb.velocity.add(new Vec2(-1 * bb.aVelocity * b.y, bb.aVelocity * b.x));
            let vab = vb.subSelf(va);
            let vd = vab.dot(n);
            if (!(vd > 0)) {
                let ca = a.cross(n),
                cb = b.cross(n),
                u =  - (Math.min(ba.restitution, bb.restitution) + 1);
                let uvd = u * vd;
                uvd /= ca * ca * ba.inertia + cb * cb * bb.inertia + ba.iMass + bb.iMass;
                let vn = n.scale(uvd);
                ba.velocity.subSelf(vn.scale(ba.iMass));
                bb.velocity.addSelf(vn.scale(bb.iMass));
                ba.aVelocity -= ca * uvd * ba.inertia;
                bb.aVelocity += cb * uvd * bb.inertia;
                let ve = vab.sub(n.scale(vd));
                ve.normalizeSelf().scaleSelf(-1);
                let da = a.cross(ve),
                db = b.cross(ve),
                uve = u * vab.dot(ve) * Math.min(ba.friction, bb.friction);
                uve /= da * da * ba.inertia + db * db * bb.inertia + ba.iMass + bb.iMass;
                if (uve > uvd) {
                    uve = uvd;
                }
                vn = ve.scale(uve);
                ba.velocity.subSelf(vn.scale(ba.iMass));
                bb.velocity.addSelf(vn.scale(bb.iMass));
                ba.aVelocity -= da * uve * ba.inertia;
                bb.aVelocity += db * uve * bb.inertia;
            }
        }
    }
	updateBodies(dt) {
		let worldForce = this.gravity.add(this.wind),
		i = 0, body;
		do {
			body = this.bodies[i];
			body.collisionList.length = 0;
			if (body.iMass > 0) {
				if (this.flagMove) {
					//body.acceleration.addSelf(worldForce.scale(1 + body.iMass));
					body.acceleration.addSelf(worldForce );
					body.velocity.addSelf(body.acceleration.scale(dt));
					body.move(body.velocity.scale(dt));
					body.aVelocity += body.aAcceleration * dt;
					body.rotate(body.aVelocity * dt);
					body.acceleration.x = body.acceleration.y = 0;
				}
				if (this.flagCheckOutbound) {
					if (body.pos.x > this.width || body.pos.x < 0 || body.pos.y > this.height || body.pos.y < -this.height) {
						this.bodies.splice(i, 1);
						body.dispose();
						continue;
					}
				}
			}
			i++;
		}
		while (i < this.bodies.length);
    }
	update() {
		let cTime = Date.now();
		this.dt = (cTime - this.lastTime) * this.timeFactor;
		this.lastTime = cTime;
		this.updateBodies(this.dt);
		this.collision();
	}
	resize(w, h) {
		this.width = w;
		this.height = h;
	}
}
