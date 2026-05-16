export interface ResumeProfile {
	firstName: string;
	lastName: string;
	title: string;
	intro: string;
	availability: string;
	location: string;
	avatarInitials: string;
	avatarSrc?: string;
}

export interface SkillGroup {
	id: string;
	title: string;
	skills: Skill[];
}

export interface Skill {
	name: string;
	years?: number;
}

export type Hat = "sapui5" | "fullstack" | "mobile";

export interface TimelinePhase {
	id: string;
	team: string;
	role: string;
	hat: Hat;
	additionalHats?: Hat[];
	start: string;
	end: string | null;
	current: boolean;
	summary: string;
	achievements: string[];
	technologies: string[];
}

export interface TimelineEngagement {
	id: string;
	client: string;
	department: string;
	city: string;
	clientLogoIcon: string;
	start: string;
	end: string | null;
	current: boolean;
	/** When true, this engagement was not full-time / parallel to a main engagement. Renders lighter. */
	parallel?: boolean;
	phases: TimelinePhase[];
}

export type EmployerKind = "direct" | "consultancy";

export interface TimelineEmployer {
	id: string;
	name: string;
	kind: EmployerKind;
	country: string;
	countryEmoji: string;
	city: string;
	start: string;
	end: string | null;
	current: boolean;
	engagements: TimelineEngagement[];
}

export interface Education {
	institution: string;
	degree: string;
	field: string;
	start: string;
	end: string;
	city: string;
	/** Institution website, opened when the name/logo is clicked. */
	url?: string;
	/** Logo image path (e.g. assets/khas-logo.png). Falls back to an education icon. */
	logoSrc?: string;
}

export interface Certification {
	id: string;
	name: string;
	issuer: string;
	issued: string;
	city?: string;
	/** Public verification link, e.g. credly.com/badges/<uuid> or sap.com badge URL. */
	verifyUrl?: string;
}

export interface Language {
	name: string;
	level: string;
}

export type ContactChannelType = "email" | "phone" | "teams" | "linkedin" | "github" | "website";

export interface ContactChannel {
	type: ContactChannelType;
	label: string;
	value: string;
	href: string;
	icon: string;
	primary?: boolean;
}

export interface ResumeSeo {
	title: string;
	description: string;
	canonicalUrl?: string;
}

export interface ResumeData {
	profile: ResumeProfile;
	summary: string;
	skills: SkillGroup[];
	timeline: {
		employers: TimelineEmployer[];
	};
	education: Education[];
	certifications: Certification[];
	languages: Language[];
	contact: {
		channels: ContactChannel[];
	};
	seo: ResumeSeo;
}
