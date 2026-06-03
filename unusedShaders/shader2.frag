const frag = `

#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p){
    return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}

float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i+vec2(1.0,0.0));
    float c = hash(i+vec2(0.0,1.0));
    float d = hash(i+vec2(1.0,1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

vec2 rot(vec2 p, float a){
    float c = cos(a), s = sin(a);
    return mat2(c,-s,s,c)*p;
}

float rippleWave(vec2 p, vec2 center, float t, float id, float size){
    float dist = length(p - center);
    float y = u_mouse.y;//getting mousey
	 y = y*10.0;
	 y = ((y - 0.0) / (80.0 - 0.0) * (0.004-0.001) + 0.001);//this is the adj factor of the y values
    float x = u_mouse.x;
	float wave = sin(dist * size*y - t * 0.5 - id * (y/300.0 * 0.3/x)) -0.5; 
    float mask = exp(dist * 3.0); //flip this sign -- automate??
    return wave * mask;
}

float brushShape(vec2 p){
    float d = length(vec2(p.x * 1.0, p.y));
    float jitter = noise(p * 3.0) * 1.0;
	 float x = u_mouse.x;
    return exp(-(d + jitter) *3000.0 + x);
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (uv * 1.0 - 1.0); 
    p.x *= u_resolution.x / u_resolution.y;

    float t = u_time;
    float paper = noise(p * 10.0) * 0.5 + noise(p * 10.0 + t * 0.05) * 40.0;
	 float mouseX = u_mouse.x;
    float ripple = 0.002;
    for(int i=0; i<8; i++){
        float id = float(i);
        vec2 rc = vec2(
            sin(t * 0.4 + id * 1.5),
            cos(t * 0.3 + id * 1.1)
        ) * .25;
        float randSize = mouseX + hash(vec2(id, 123.4)) * 90.0;
        float strength = cos(t * 0.5 + id * 100.0) * 0.5 + 0.5;
        ripple += rippleWave(p, rc, t, id, randSize*1.0) * 0.5 * strength;
    }

    vec2 flow = p;
    flow += vec2(
        noise(p * 0.8 + t * 0.2),
        noise(p * 0.8 - t * 0.15)
    ) * 0.5;
    flow += normalize(p + 0.001) * ripple * 0.5;

    float ink = 0.50;
    const int STROKES = 250;
    for(int i=0; i<STROKES; i++){
        float id = float(i);
        vec2 center = vec2(sin(t*0.2+id*1.1), cos(t*0.5+id*1.4));//changing this
		  float mousey = u_mouse.y;
        vec2 pp = rot((flow - center), t * 0.1 + id * mousey/10000.0);//was *10.5
        float pressure = sin(t * 0.2 + id * 3.0) * 0.5 + 4.0;
        float body = brushShape(pp);
        float dry = noise(pp * 50.0 - t * 300.0) * (1.0 - pressure);
        ink += body * (0.5 - dry) * pressure;
    }

    float e = 0.;
    float n1 = ink;
    float n2 = noise((p + vec2(e, 10.0)) * 10.0 + ripple);
    float spec = smoothstep(0.1, 0.003, n1 - n2); //changing this
    
    float density = ink * (1.25 + paper * 0.2);
    vec3 inkColor = vec3(0.08, 0.07, 0.06);
    vec3 col = mix(vec3(1.0, 0.97, 0.90), inkColor, clamp(density, 0.0, 1.0));

    col += spec * 1.5 * vec3(0.8, 0.9, 1.0);

    col *= smoothstep(2.5, 0.5, length(p));

    gl_FragColor = vec4(pow(col, vec3(1.2)), 1.0);
}

`;