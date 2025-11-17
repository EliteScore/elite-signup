type AnyEntry = Record<string, any>

export type ExperienceEntry = {
	title?: string
	company?: string
	employment_type?: string | null
	location?: string | null
	start_date?: string | null
	end_date?: string | null
	is_current?: boolean
	description?: string | null
	achievements?: string[]
}

export type EducationEntry = {
	school?: string
	degree?: string
	field_of_study?: string | null
	start_date?: string | null
	end_date?: string | null
	grade?: string | null
	activities?: string | null
	description?: string | null
}

function collectGarbageText(raw: AnyEntry, allowedKeys: Set<string>): {
	text: string | null
	hasEndDateNull: boolean
} {
	const chunks: string[] = []
	let hasEndDateNull = false

	for (const [key, value] of Object.entries(raw)) {
		if (key.startsWith("end_date=")) {
			hasEndDateNull = true
		}

		const isAllowed = allowedKeys.has(key)
		const isBlankKey = key.trim().length === 0
		const isWeirdKey = key.includes("=")

		if ((!isAllowed || isBlankKey || isWeirdKey) && typeof value === "string") {
			chunks.push(value)
		}
	}

	return {
		text: chunks.length ? chunks.join(" ") : null,
		hasEndDateNull,
	}
}

function cleanEntryWithDescription(
	raw: AnyEntry,
	allowedKeys: Set<string>,
	options?: { hasEndDateField?: boolean },
): AnyEntry {
	const fixed: AnyEntry = {}

	for (const [key, value] of Object.entries(raw)) {
		if (allowedKeys.has(key)) {
			fixed[key] = value
		}
	}

	const { text, hasEndDateNull } = collectGarbageText(raw, allowedKeys)

	if (text) {
		if (typeof fixed.description === "string" && fixed.description.length > 0) {
			fixed.description = `${fixed.description} ${text}`
		} else if (!("description" in fixed)) {
			fixed.description = text
		}
	}

	if (options?.hasEndDateField && !("end_date" in fixed) && hasEndDateNull) {
		fixed.end_date = null
	}

	return fixed
}

const EDUCATION_KEYS = new Set([
	"school",
	"degree",
	"field_of_study",
	"start_date",
	"end_date",
	"grade",
	"activities",
	"description",
])

const EXPERIENCE_KEYS = new Set([
	"title",
	"company",
	"employment_type",
	"location",
	"start_date",
	"end_date",
	"is_current",
	"description",
	"achievements",
])

const PROJECT_KEYS = new Set([
	"name",
	"description",
	"start_date",
	"end_date",
	"url",
	"highlights",
	"tech",
])

const VOLUNTEER_KEYS = new Set(["role", "organization", "cause", "start_date", "end_date", "description"])

const HONOR_AWARD_KEYS = new Set(["title", "issuer", "date", "description"])

const LANGUAGE_KEYS = new Set(["name", "proficiency", "language", "fluency"])

const CERTIFICATION_KEYS = new Set(["name", "issuer", "date", "url", "description"])

const PUBLICATION_KEYS = new Set(["title", "publisher", "date", "url", "description"])

export function sanitizeCvForPost(cvData: any) {
	const rawProfile = cvData.profile ?? cvData
	const profile: any = {}

	profile.basics =
		rawProfile.basics && typeof rawProfile.basics === "object"
			? rawProfile.basics
			: {}

	profile.education = Array.isArray(rawProfile.education)
		? rawProfile.education.map((e: any) =>
				cleanEntryWithDescription(e, EDUCATION_KEYS, { hasEndDateField: true }),
			)
		: []

	profile.experience = Array.isArray(rawProfile.experience)
		? rawProfile.experience.map((e: any) => {
				const fixed = cleanEntryWithDescription(e, EXPERIENCE_KEYS, { hasEndDateField: true })
				if (!Array.isArray(fixed.achievements)) {
					fixed.achievements = []
				}
				return fixed
			})
		: []

	profile.projects = Array.isArray(rawProfile.projects)
		? rawProfile.projects.map((p: any) => {
				const fixed = cleanEntryWithDescription(p, PROJECT_KEYS, { hasEndDateField: true })

				if (!Array.isArray(fixed.highlights)) fixed.highlights = []
				if (!Array.isArray(fixed.tech)) fixed.tech = []
				if (fixed.url === undefined) fixed.url = null

				return fixed
			})
		: []

	if (Array.isArray(rawProfile.extracurriculars)) {
		const extraProjects = rawProfile.extracurriculars.map((e: any) => {
			const fixed = cleanEntryWithDescription(e, PROJECT_KEYS, { hasEndDateField: true })

			if (!fixed.name && e.title) fixed.name = e.title
			if (!fixed.name && e.name) fixed.name = e.name

			if (!Array.isArray(fixed.highlights)) fixed.highlights = []
			if (!Array.isArray(fixed.tech)) fixed.tech = []
			if (fixed.url === undefined) fixed.url = null

			return fixed
		})

		profile.projects = [...profile.projects, ...extraProjects]
	}

	profile.skills = Array.isArray(rawProfile.skills)
		? rawProfile.skills.filter((s: any) => typeof s === "string")
		: []

	profile.honors_awards = Array.isArray(rawProfile.honors_awards)
		? rawProfile.honors_awards.map((h: any) => cleanEntryWithDescription(h, HONOR_AWARD_KEYS))
		: []

	profile.volunteer = Array.isArray(rawProfile.volunteer)
		? rawProfile.volunteer.map((v: any) =>
				cleanEntryWithDescription(v, VOLUNTEER_KEYS, { hasEndDateField: true }),
			)
		: []

	profile.languages = Array.isArray(rawProfile.languages)
		? rawProfile.languages.map((l: any) => {
				const fixed: any = {}
				for (const [key, value] of Object.entries(l)) {
					if (LANGUAGE_KEYS.has(key)) fixed[key] = value
				}
				if (!fixed.language && fixed.name) {
					fixed.language = fixed.name
					delete fixed.name
				}
				return fixed
			})
		: []

	profile.certifications = Array.isArray(rawProfile.certifications)
		? rawProfile.certifications.map((c: any) => {
				const fixed: any = {}
				for (const [key, value] of Object.entries(c)) {
					if (CERTIFICATION_KEYS.has(key)) fixed[key] = value
				}
				return fixed
			})
		: []

	profile.publications = Array.isArray(rawProfile.publications)
		? rawProfile.publications.map((p: any) => cleanEntryWithDescription(p, PUBLICATION_KEYS))
		: []

	return { profile }
}

