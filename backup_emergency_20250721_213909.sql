--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    user_role character varying(20) NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(255),
    entity_name character varying(255),
    description text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_user_role_check CHECK (((user_role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: company_leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_leaves (
    id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    employee_data jsonb NOT NULL,
    leave_type character varying(100) NOT NULL,
    leave_date date NOT NULL,
    leave_requested_at timestamp without time zone NOT NULL,
    leave_requested_by character varying(255) NOT NULL,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    status character varying(50) DEFAULT 'approved'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.company_leaves OWNER TO postgres;

--
-- Name: company_leaves_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_leaves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_leaves_id_seq OWNER TO postgres;

--
-- Name: company_leaves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_leaves_id_seq OWNED BY public.company_leaves.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id_glovo character varying(50) NOT NULL,
    email_glovo character varying(100),
    turno character varying(50),
    nombre character varying(100) NOT NULL,
    apellido character varying(100),
    telefono character varying(50),
    email character varying(100),
    horas integer,
    cdp integer,
    complementaries text,
    ciudad character varying(100),
    citycode character varying(50),
    dni_nie character varying(50),
    iban character varying(34),
    direccion character varying(255),
    vehiculo character varying(50),
    naf character varying(50),
    fecha_alta_seg_soc date,
    status_baja character varying(50),
    estado_ss character varying(50),
    informado_horario boolean DEFAULT false,
    cuenta_divilo character varying(100),
    proxima_asignacion_slots date,
    jefe_trafico character varying(100),
    coments_jefe_de_trafico text,
    incidencias text,
    fecha_incidencia date,
    faltas_no_check_in_en_dias integer DEFAULT 0,
    cruce text,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    penalization_start_date date,
    penalization_end_date date,
    original_hours integer,
    flota character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vacaciones_disfrutadas numeric(6,2) DEFAULT 0.00,
    vacaciones_pendientes numeric(6,2) DEFAULT 0.00,
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'it_leave'::character varying, 'company_leave_pending'::character varying, 'company_leave_approved'::character varying, 'pending_laboral'::character varying, 'penalizado'::character varying])::text[])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: it_leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.it_leaves (
    id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    leave_type character varying(100) NOT NULL,
    leave_date timestamp without time zone NOT NULL,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    requested_by character varying(255) NOT NULL,
    approved_by character varying(255),
    approved_at timestamp without time zone,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.it_leaves OWNER TO postgres;

--
-- Name: it_leaves_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.it_leaves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.it_leaves_id_seq OWNER TO postgres;

--
-- Name: it_leaves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.it_leaves_id_seq OWNED BY public.it_leaves.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    requested_by character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    metadata jsonb,
    processing_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session (
    sid character varying(255) NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO postgres;

--
-- Name: system_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true,
    created_by character varying(255) NOT NULL,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_city character varying(200),
    CONSTRAINT system_users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'normal'::character varying])::text[])))
);


ALTER TABLE public.system_users OWNER TO postgres;

--
-- Name: system_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_users_id_seq OWNER TO postgres;

--
-- Name: system_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_users_id_seq OWNED BY public.system_users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: company_leaves id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_leaves ALTER COLUMN id SET DEFAULT nextval('public.company_leaves_id_seq'::regclass);


--
-- Name: it_leaves id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.it_leaves ALTER COLUMN id SET DEFAULT nextval('public.it_leaves_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: system_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users ALTER COLUMN id SET DEFAULT nextval('public.system_users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_role, action, entity_type, entity_id, entity_name, description, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
1	SYSTEM	super_admin	system_init	database	db_init	Database Initialization	Sistema Solucioning inicializado con tablas y super admin users	\N	\N	127.0.0.1	System	2025-07-06 18:18:34.103785
2	nmartinez@solucioning.net	super_admin	create_employee	employee	00000001	test test	Empleado creado: test test (00000001)	\N	{"cdp": 100, "naf": "836762764876", "iban": "es53545534565645665456", "cruce": null, "email": "nicolas.martinez23@gmail.com", "flota": "SOLUCIONING", "horas": 38, "turno": "mañana", "ciudad": "barcelona", "dniNie": null, "nombre": "test", "status": "active", "idGlovo": "00000001", "apellido": "test", "cityCode": "Barcelona", "estadoSs": null, "telefono": "789878877", "vehiculo": "Patinete", "createdAt": "2025-07-06T19:18:00.038Z", "direccion": "Carrer de Sardenya 94 1-1", "updatedAt": "2025-07-06T19:18:00.038Z", "emailGlovo": "nicolas.martinez23@gmail.com", "statusBaja": null, "incidencias": "test", "jefeTrafico": "test", "cuentaDivilo": "no", "originalHours": null, "complementaries": "test", "fechaAltaSegSoc": null, "fechaIncidencia": null, "informadoHorario": false, "penalizationEndDate": null, "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": null, "proximaAsignacionSlots": null}	\N	unknown	2025-07-06 19:18:00.044671
3	nmartinez@solucioning.net	super_admin	penalize_employee	employee	00000001	test test	Empleado penalizado: test test (00000001) desde 2025-07-09 hasta 2025-08-02	{"cdp": 100, "naf": "836762764876", "iban": "es53545534565645665456", "cruce": null, "email": "nicolas.martinez23@gmail.com", "flota": "SOLUCIONING", "horas": 38, "turno": "mañana", "ciudad": "barcelona", "dniNie": null, "nombre": "test", "status": "active", "idGlovo": "00000001", "apellido": "test", "cityCode": "Barcelona", "estadoSs": null, "telefono": "789878877", "vehiculo": "Patinete", "createdAt": "2025-07-06T19:18:00.038Z", "direccion": "Carrer de Sardenya 94 1-1", "updatedAt": "2025-07-06T19:18:00.038Z", "emailGlovo": "nicolas.martinez23@gmail.com", "statusBaja": null, "incidencias": "test", "jefeTrafico": "test", "cuentaDivilo": "no", "originalHours": null, "complementaries": "test", "fechaAltaSegSoc": null, "fechaIncidencia": null, "informadoHorario": false, "penalizationEndDate": null, "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": null, "proximaAsignacionSlots": null}	{"cdp": 100, "naf": "836762764876", "iban": "es53545534565645665456", "cruce": null, "email": "nicolas.martinez23@gmail.com", "flota": "SOLUCIONING", "horas": 0, "turno": "mañana", "ciudad": "barcelona", "dniNie": null, "nombre": "test", "status": "penalizado", "idGlovo": "00000001", "apellido": "test", "cityCode": "Barcelona", "estadoSs": null, "telefono": "789878877", "vehiculo": "Patinete", "createdAt": "2025-07-06T19:18:00.038Z", "direccion": "Carrer de Sardenya 94 1-1", "updatedAt": "2025-07-06T19:18:16.469Z", "emailGlovo": "nicolas.martinez23@gmail.com", "statusBaja": null, "incidencias": "test", "jefeTrafico": "test", "cuentaDivilo": "no", "originalHours": 38, "complementaries": "test", "fechaAltaSegSoc": null, "fechaIncidencia": null, "informadoHorario": false, "penalizationEndDate": "2025-08-02", "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": "2025-07-09", "proximaAsignacionSlots": null}	\N	unknown	2025-07-06 19:18:16.473946
4	nmartinez@solucioning.net	super_admin	set_it_leave	employee	00000001	test test	Empleado marcado como baja IT (00000001) con fecha 2025-07-06T19:18:29.238Z	\N	{"cdp": 100, "naf": "836762764876", "iban": "es53545534565645665456", "cruce": null, "email": "nicolas.martinez23@gmail.com", "flota": "SOLUCIONING", "horas": 0, "turno": "mañana", "ciudad": "barcelona", "dniNie": null, "nombre": "test", "status": "it_leave", "idGlovo": "00000001", "apellido": "test", "cityCode": "Barcelona", "estadoSs": null, "telefono": "789878877", "vehiculo": "Patinete", "createdAt": "2025-07-06T19:18:00.038Z", "direccion": "Carrer de Sardenya 94 1-1", "updatedAt": "2025-07-06T19:18:29.238Z", "emailGlovo": "nicolas.martinez23@gmail.com", "statusBaja": null, "incidencias": "test", "jefeTrafico": "test", "cuentaDivilo": "no", "originalHours": 38, "complementaries": "test", "fechaAltaSegSoc": null, "fechaIncidencia": "2025-07-06", "informadoHorario": false, "penalizationEndDate": "2025-08-02", "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": "2025-07-09", "proximaAsignacionSlots": null}	\N	unknown	2025-07-06 19:18:29.251189
5	nmartinez@solucioning.net	super_admin	update_employee	employee	00000001	test test	Empleado actualizado: test test (00000001)	{"cdp": 100, "naf": "836762764876", "iban": "es53545534565645665456", "cruce": null, "email": "nicolas.martinez23@gmail.com", "flota": "SOLUCIONING", "horas": 0, "turno": "mañana", "ciudad": "barcelona", "dniNie": null, "nombre": "test", "status": "it_leave", "idGlovo": "00000001", "apellido": "test", "cityCode": "Barcelona", "estadoSs": null, "telefono": "789878877", "vehiculo": "Patinete", "createdAt": "2025-07-06T19:18:00.038Z", "direccion": "Carrer de Sardenya 94 1-1", "updatedAt": "2025-07-06T19:18:29.238Z", "emailGlovo": "nicolas.martinez23@gmail.com", "statusBaja": null, "incidencias": "test", "jefeTrafico": "test", "cuentaDivilo": "no", "originalHours": 38, "complementaries": "test", "fechaAltaSegSoc": null, "fechaIncidencia": "2025-07-06", "informadoHorario": false, "penalizationEndDate": "2025-08-02", "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": "2025-07-09", "proximaAsignacionSlots": null}	{"cdp": 0, "naf": "836762764876", "iban": "es53545534565645665456", "cruce": null, "email": "nicolas.martinez23@gmail.com", "flota": "SOLUCIONING", "horas": 0, "turno": "mañana", "ciudad": "barcelona", "dniNie": null, "nombre": "test", "status": "active", "idGlovo": "00000001", "apellido": "test", "cityCode": "Barcelona", "estadoSs": null, "telefono": "789878877", "vehiculo": "Patinete", "createdAt": "2025-07-06T19:18:00.038Z", "direccion": "Carrer de Sardenya 94 1-1", "updatedAt": "2025-07-06T19:18:29.238Z", "emailGlovo": "nicolas.martinez23@gmail.com", "statusBaja": null, "incidencias": "test", "jefeTrafico": "test", "cuentaDivilo": "no", "originalHours": 38, "complementaries": "test", "fechaAltaSegSoc": null, "fechaIncidencia": "2025-07-06", "informadoHorario": false, "penalizationEndDate": "2025-08-02", "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": "2025-07-09", "proximaAsignacionSlots": null}	\N	unknown	2025-07-06 19:19:03.537796
6	nmartinez@solucioning.net	super_admin	create_employee	employee	hjkhkj	hjk h	Empleado creado: hjk h (hjkhkj)	\N	{"cdp": 0, "naf": null, "iban": null, "cruce": null, "email": "hfdjhjfh@gmail.com", "flota": "", "horas": 0, "turno": null, "ciudad": null, "dniNie": null, "nombre": "hjk", "status": "active", "idGlovo": "hjkhkj", "apellido": "h", "cityCode": null, "estadoSs": null, "telefono": "h", "vehiculo": "Patinete", "createdAt": "2025-07-06T19:26:19.189Z", "direccion": null, "updatedAt": "2025-07-06T19:26:19.189Z", "emailGlovo": null, "statusBaja": null, "incidencias": null, "jefeTrafico": null, "cuentaDivilo": null, "originalHours": null, "complementaries": null, "fechaAltaSegSoc": null, "fechaIncidencia": null, "informadoHorario": false, "penalizationEndDate": null, "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": null, "proximaAsignacionSlots": null}	\N	unknown	2025-07-06 19:26:19.192228
7	nmartinez@solucioning.net	super_admin	create_employee	employee	sdfdsffs	jkhjh kjhjkh	Empleado creado: jkhjh kjhjkh (sdfdsffs)	\N	{"cdp": 0, "naf": null, "iban": null, "cruce": null, "email": "nmartinez@solucioning.net", "flota": "SOLUCIONING-JJ", "horas": 0, "turno": null, "ciudad": null, "dniNie": null, "nombre": "jkhjh", "status": "active", "idGlovo": "sdfdsffs", "apellido": "kjhjkh", "cityCode": null, "estadoSs": null, "telefono": "kjhkjhj", "vehiculo": "Moto", "createdAt": "2025-07-06T20:45:43.624Z", "direccion": "test 123 barcelona", "updatedAt": "2025-07-06T20:45:43.624Z", "emailGlovo": "nmartinez@solucioning.net", "statusBaja": null, "incidencias": null, "jefeTrafico": null, "cuentaDivilo": null, "originalHours": null, "complementaries": null, "fechaAltaSegSoc": null, "fechaIncidencia": null, "informadoHorario": false, "penalizationEndDate": null, "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": null, "proximaAsignacionSlots": null}	\N	unknown	2025-07-06 20:45:43.632766
8	nmartinez@solucioning.net	super_admin	update_employee	employee	sdfdsffs	jkhjh kjhjkh	Empleado actualizado: jkhjh kjhjkh (sdfdsffs)	{"cdp": 0, "naf": null, "iban": null, "cruce": null, "email": "nmartinez@solucioning.net", "flota": "SOLUCIONING-JJ", "horas": 0, "turno": null, "ciudad": null, "dniNie": null, "nombre": "jkhjh", "status": "active", "idGlovo": "sdfdsffs", "apellido": "kjhjkh", "cityCode": null, "estadoSs": null, "telefono": "kjhkjhj", "vehiculo": "Moto", "createdAt": "2025-07-06T20:45:43.624Z", "direccion": "test 123 barcelona", "updatedAt": "2025-07-06T20:45:43.624Z", "emailGlovo": "nmartinez@solucioning.net", "statusBaja": null, "incidencias": null, "jefeTrafico": null, "cuentaDivilo": null, "originalHours": null, "complementaries": null, "fechaAltaSegSoc": null, "fechaIncidencia": null, "informadoHorario": false, "penalizationEndDate": null, "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": null, "proximaAsignacionSlots": null}	{"cdp": 100, "naf": null, "iban": null, "cruce": null, "email": "nmartinez@solucioning.net", "flota": "SOLUCIONING-JJ", "horas": 38, "turno": null, "ciudad": null, "dniNie": null, "nombre": "jkhjh", "status": "active", "idGlovo": "sdfdsffs", "apellido": "kjhjkh", "cityCode": null, "estadoSs": null, "telefono": "kjhkjhj", "vehiculo": "Moto", "createdAt": "2025-07-06T20:45:43.624Z", "direccion": "test 123 barcelona", "updatedAt": "2025-07-06T20:45:43.624Z", "emailGlovo": "nmartinez@solucioning.net", "statusBaja": null, "incidencias": null, "jefeTrafico": null, "cuentaDivilo": null, "originalHours": null, "complementaries": null, "fechaAltaSegSoc": null, "fechaIncidencia": null, "informadoHorario": false, "penalizationEndDate": null, "comentsJefeDeTrafico": null, "faltasNoCheckInEnDias": 0, "penalizationStartDate": null, "proximaAsignacionSlots": null}	\N	unknown	2025-07-06 20:46:07.41474
\.


--
-- Data for Name: company_leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_leaves (id, employee_id, employee_data, leave_type, leave_date, leave_requested_at, leave_requested_by, approved_by, approved_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id_glovo, email_glovo, turno, nombre, apellido, telefono, email, horas, cdp, complementaries, ciudad, citycode, dni_nie, iban, direccion, vehiculo, naf, fecha_alta_seg_soc, status_baja, estado_ss, informado_horario, cuenta_divilo, proxima_asignacion_slots, jefe_trafico, coments_jefe_de_trafico, incidencias, fecha_incidencia, faltas_no_check_in_en_dias, cruce, status, penalization_start_date, penalization_end_date, original_hours, flota, created_at, updated_at, vacaciones_disfrutadas, vacaciones_pendientes) FROM stdin;
00000001	nicolas.martinez23@gmail.com	mañana	test	test	789878877	nicolas.martinez23@gmail.com	0	0	test	barcelona	Barcelona	\N	es53545534565645665456	Carrer de Sardenya 94 1-1	Patinete	836762764876	\N	\N	\N	f	no	\N	test	\N	test	2025-07-06	0	\N	active	2025-07-09	2025-08-02	38	SOLUCIONING	2025-07-06 19:18:00.038299	2025-07-06 19:18:29.238	0.00	0.00
hjkhkj	\N	\N	hjk	h	h	hfdjhjfh@gmail.com	0	0	\N	\N	\N	\N	\N	\N	Patinete	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	0	\N	active	\N	\N	\N		2025-07-06 19:26:19.189447	2025-07-06 19:26:19.189447	0.00	0.00
sdfdsffs	nmartinez@solucioning.net	\N	jkhjh	kjhjkh	kjhkjhj	nmartinez@solucioning.net	38	100	\N	\N	\N	\N	\N	test 123 barcelona	Moto	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	0	\N	active	\N	\N	\N	SOLUCIONING-JJ	2025-07-06 20:45:43.624778	2025-07-06 20:45:43.624778	0.00	0.00
\.


--
-- Data for Name: it_leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.it_leaves (id, employee_id, leave_type, leave_date, requested_at, requested_by, approved_by, approved_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, type, title, message, requested_by, status, metadata, processing_date, created_at, updated_at) FROM stdin;
1	employee_update	Empleado Penalizado	El empleado test test (00000001) ha sido penalizado desde 2025-07-09 hasta 2025-08-02. Observaciones: mala conducta	SYSTEM	processed	{"endDate": "2025-08-02", "startDate": "2025-07-09", "employeeId": "00000001", "observations": "mala conducta", "originalHours": 38}	\N	2025-07-06 19:18:16.472203	2025-07-06 19:18:16.472203
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session (sid, sess, expire) FROM stdin;
eMIh_pd61zCQ7BbyFe0rBVwpkdY81_se	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T18:26:00.116Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 18:26:01
1CVKGYyQxxgcc1ZxysAw_Uqy2D4F1qeI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T18:44:52.135Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 18:44:53
sqQ8i23JXl_OCUjT2fh5SVQHI6mj6VGb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T18:47:32.858Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 18:47:33
AeRCrTP2mvaoL6JeRN0RUwBElStX9Cja	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T18:51:08.982Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 18:51:09
DNCe9WUbu0jimewGAd5QLjN4QGV4uf4M	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T18:51:09.069Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 18:51:10
bKgxHh1hdMsrFuyruVIT6vctK-HVz72Z	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T18:51:55.771Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 18:51:56
nn8imKDkFIv5LmCo7M39KAIlpN3YIs3W	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T19:08:13.198Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 19:30:44
GOOPJZ1li1nTVyCgUrrtR-mnT7ISYetW	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T20:45:18.568Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 20:46:50
XnyGyfYHF8y1cA-bWSDdA9mT440LexDV	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T20:33:40.718Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 20:59:45
hCLOJWvOfVsptev2jb3l-V4rQCuSoEh7	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-13T20:46:56.307Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"id":"1","email":"nmartinez@solucioning.net","firstName":"Nicolas","lastName":"Martinez","role":"super_admin"}}	2025-07-13 20:47:28
\.


--
-- Data for Name: system_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_users (id, email, first_name, last_name, password, role, is_active, created_by, last_login, created_at, updated_at, assigned_city) FROM stdin;
2	lvega@solucioning.net	Luciana	Vega	$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	super_admin	t	SYSTEM	\N	2025-07-06 18:18:34.101866	2025-07-06 18:18:34.101866	\N
1	nmartinez@solucioning.net	Nicolas	Martinez	\\\\\\/UO20lhuZtvqNQaIzXzP6xSCHZRooGv/7AHfmXu	super_admin	t	SYSTEM	2025-07-06 20:46:56.305	2025-07-06 18:18:34.101866	2025-07-06 18:18:34.101866	\N
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 39, true);


--
-- Name: company_leaves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_leaves_id_seq', 55, true);


--
-- Name: it_leaves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.it_leaves_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: system_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_users_id_seq', 37, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: company_leaves company_leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_leaves
    ADD CONSTRAINT company_leaves_pkey PRIMARY KEY (id);


--
-- Name: employees employees_dni_nie_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_dni_nie_unique UNIQUE (dni_nie);


--
-- Name: employees employees_email_glovo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_email_glovo_key UNIQUE (email_glovo);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id_glovo);


--
-- Name: it_leaves it_leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.it_leaves
    ADD CONSTRAINT it_leaves_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: system_users system_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_email_key UNIQUE (email);


--
-- Name: system_users system_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_company_leaves_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_company_leaves_employee_id ON public.company_leaves USING btree (employee_id);


--
-- Name: idx_employees_ciudad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_ciudad ON public.employees USING btree (ciudad);


--
-- Name: idx_employees_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_nombre ON public.employees USING btree (nombre);


--
-- Name: idx_employees_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_status ON public.employees USING btree (status);


--
-- Name: idx_it_leaves_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_it_leaves_employee_id ON public.it_leaves USING btree (employee_id);


--
-- Name: idx_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_status ON public.notifications USING btree (status);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_expire ON public.session USING btree (expire);


--
-- Name: idx_system_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_users_email ON public.system_users USING btree (email);


--
-- Name: idx_system_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_users_is_active ON public.system_users USING btree (is_active);


--
-- Name: idx_system_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_system_users_role ON public.system_users USING btree (role);


--
-- PostgreSQL database dump complete
--

