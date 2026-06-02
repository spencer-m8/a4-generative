const frag = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

//-------------------------------------
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

float getRippleHeight(vec2 p, float t) {
    float h = .0;
    for(int i=0; i<8; i++){
        float id = float(i);
        vec2 rc = vec2(sin(t*0.4 + id*1.5), cos(t*0.3 + id*2.1)) * 0.5;
        float dist = length(p - rc);
        
        float freq = 30.0 + hash(vec2(id)) * 10.0;
        float wave = sin(dist * freq - t * 5.0);
        
        float atten = exp(-dist * 3.5) * (sin(t * 0.5 + id) * 0.5 + 0.5);
        h += wave * atten * 1.1;
    }
    return h;
}

vec2 rot(vec2 p, float a){
    float c = cos(a), s = sin(a);
    return mat2(c,-s,s,-c)*p;
}

void main(){
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = (uv * 1.0 - 1.0);
    p.x *= u_resolution.x / u_resolution.y;
    float t = u_time;

    float e = 0.01; 
    float h = getRippleHeight(p, t);
    float hx = getRippleHeight(p + vec2(e, 0.01), t) - h; 
    float hy = getRippleHeight(p + vec2(.0, e), t) - h; 
	
    vec3 normal = normalize(vec3(-hx, -hy, e));
    
    vec2 distortedP = p + normal.xy * 0.2;
    float bgNoise = noise(distortedP * 0.1 + t * 0.1);
    vec3 bgColor = mix(vec3(0.96, 0.94, 0.9), vec3(0.88, 0.9, 0.92), bgNoise);
    bgColor -= noise(distortedP * 1000.0) * 0.09;

    float ink = .2;
    const int STROKES = 32;
    for(int i=0; i<STROKES; i++){
        float id = float(i);
        vec2 center = vec2(sin(t*0.15 + id*1.2), cos(t*0.2 + id*1.5)) * 0.7;
        vec2 pp = rot(distortedP - center, t*0.5 + id*1.3);
        
        float d = length(vec2(pp.x * 0.4, pp.y));
        float shape = exp(-(d + noise(pp*20.0)*0.1) * 12.0);
        float prs = sin(t*0.3 + id*2.0) * 0.5 + 0.5;
        ink += shape * prs;
    }

    vec3 lightDir = normalize(vec3(1.0, 1.0, .2));
    float spec = pow(max(dot(normal, lightDir), 0.0), 32.0);
    float rim = pow(1.0 - max(dot(normal, vec3(0,0,1)), 0.0), 10.0);

    vec3 inkColor = vec3(0.05, 0.04, 0.06);
    vec3 col = mix(bgColor, inkColor, clamp(ink * (1.0 + normal.y * 0.5), 0.0, 1.0));
    
    col += spec * .5; 
    col += rim * 0.1 * vec3(0.8, 0.9, 1.0);

    col *= smoothstep(2.2, 0.5, length(p));

    gl_FragColor = vec4(pow(col, vec3(1.1)), 1.0);
}
`;