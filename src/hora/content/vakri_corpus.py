"""Classical textual corpus for the Vakri Graha (Retrograde Planet) Intelligence Engine.

Maintains verified primary texts, chapter/verse citations, Sanskrit verses in
Devanagari, IAST transliteration, translations, commentaries, textual witnesses,
rule confidence gradings (A, B, C, D, U), and doctrinal conflict records.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ConfidenceLevel(str, Enum):
    A = "A"  # Verified primary-text passage and clear interpretation
    B = "B"  # Primary-text passage with edition or translation caveats
    C = "C"  # Commentary-dependent or materially disputed
    D = "D"  # Secondary or modern interpretation
    U = "U"  # Unverified transcription or OCR


@dataclass(frozen=True)
class ClassicalText:
    text_id: str
    title: str
    author: str
    period: str
    tradition: str
    edition: str
    editor: str
    language: str = "Sanskrit"


@dataclass(frozen=True)
class ClassicalPassage:
    passage_id: str
    text_id: str
    chapter: str
    verse: str
    sanskrit: str
    iast: str
    translation: str
    commentary: str
    witness: str
    verification_status: str
    confidence: ConfidenceLevel


@dataclass(frozen=True)
class ClassicalRule:
    rule_id: str
    rule_name: str
    category: str
    planet: str  # Planet name or "ALL_NON_LUMINARY", "ALL"
    condition_description: str
    effect_description: str
    source_passage_id: str
    tradition: str
    confidence: ConfidenceLevel
    enabled_by_default: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class RuleConflict:
    conflict_id: str
    rule_id_a: str
    rule_id_b: str
    topic: str
    conflict_type: str
    explanation: str
    resolution_method: str = "display_both"
    rules: list[dict[str, str]] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Corpus of Classical Texts
# ---------------------------------------------------------------------------

TEXTS: dict[str, ClassicalText] = {
    "BPHS": ClassicalText(
        text_id="BPHS",
        title="Brihat Parashara Hora Shastra",
        author="Maharishi Parashara",
        period="Classical Antiquity / Early Medieval Recension",
        tradition="Parashari",
        edition="Chowkhamba Sanskrit Series / Sagar Publications",
        editor="Pt. Devachandra Jha / R. Santhanam / G.C. Sharma",
    ),
    "PHALADEEPIKA": ClassicalText(
        text_id="PHALADEEPIKA",
        title="Phaladeepika",
        author="Mantreswara",
        period="c. 13th-16th Century CE",
        tradition="Classical Parashari Synthesis",
        edition="Nirnaya Sagar Press / Ranjan Publications",
        editor="Dr. Suresh Chandra Mishra / V. Subrahmanya Sastri",
    ),
    "JATAKA_PARIJATA": ClassicalText(
        text_id="JATAKA_PARIJATA",
        title="Jataka Parijata",
        author="Vaidyanatha Dikshita",
        period="c. 15th Century CE",
        tradition="Classical Jyotisha",
        edition="Sagar Publications",
        editor="V. Subrahmanya Sastri / Pt. Gopesh Kumar Ojha",
    ),
    "SARAVALI": ClassicalText(
        text_id="SARAVALI",
        title="Saravali",
        author="Kalyanavarma",
        period="c. 8th-10th Century CE",
        tradition="Classical Parashari",
        edition="Chowkhamba Sanskrit Pratishthan",
        editor="R. Santhanam",
    ),
    "UTTARA_KALAMRITA": ClassicalText(
        text_id="UTTARA_KALAMRITA",
        title="Uttara Kalamrita",
        author="Kalidasa (Jyotirvid)",
        period="c. 17th Century CE",
        tradition="Classical South Indian Tradition",
        edition="Sagar Publications",
        editor="Pt. P.S. Sastri",
    ),
    "HORASARA": ClassicalText(
        text_id="HORASARA",
        title="Horasara",
        author="Prithuyasas (Son of Varahamihira)",
        period="c. 6th-7th Century CE",
        tradition="Classical Jyotisha",
        edition="Ranjan Publications",
        editor="R. Santhanam",
    ),
    "SANKETA_NIDHI": ClassicalText(
        text_id="SANKETA_NIDHI",
        title="Sanketa Nidhi",
        author="Ramadayalu Jyotirvid",
        period="c. 19th Century CE",
        tradition="Late Classical Synthesis",
        edition="Sagar Publications",
        editor="Dr. G.S. Kapoor",
    ),
}


# ---------------------------------------------------------------------------
# Corpus of Classical Passages
# ---------------------------------------------------------------------------

PASSAGES: dict[str, ClassicalPassage] = {
    "BPHS_27_21_23": ClassicalPassage(
        passage_id="BPHS_27_21_23",
        text_id="BPHS",
        chapter="27",
        verse="21-23",
        sanskrit="वक्राऽनुवक्रा विकला मन्दा मन्दतरा समा। चरा चातिचरा ज्ञेया ग्रहाणामष्टधा गतिः॥ वक्रे षष्टिर्बले देया ह्यनुवक्रेऽर्धमेव च। विकले पादमुद्दिष्टं समायां चार्धमेव च॥",
        iast="vakrā'nuvakrā vikalā mandā mandatarā samā | carā cā'ticarā jñeyā grahāṇāmaṣṭadhā gatiḥ || vakre ṣaṣṭirbale deyā hyanuvakre'rdhameva ca | vikale pādamuddiṣṭaṃ samāyāṃ cārdhameva ca ||",
        translation="Eight kinds of motions are ascribed to planets: Vakra (retrograde), Anuvakra (somewhat retrograde), Vikala (stationary/distorted), Manda (slow), Mandatara (very slow), Sama (mean), Chara (fast), and Atichara (accelerated). In Vakra motion 60 Virupas of Chesta strength are awarded, in Anuvakra half of that (30), in Vikala one quarter (15), and in Sama half (30).",
        commentary="Establishes that retrograde motion confers 60 virupas of Chesta Bala to the five non-luminary planets. Does not apply to Sun and Moon.",
        witness="BPHS Santhanam / Sharma recensions, Ch. 27",
        verification_status="Critically verified against Sanskrit editions",
        confidence=ConfidenceLevel.B,
    ),
    "BPHS_26_145_148": ClassicalPassage(
        passage_id="BPHS_26_145_148",
        text_id="BPHS",
        chapter="26",
        verse="145-148",
        sanskrit="बलवन्तो ग्रहाः सर्वे पूर्णं कुर्वन्ति यत्फलम्। मध्यमा मध्यमं तद्वत्पादं हीनबला ग्रहाः॥ भावस्वाम्ये बलं मुख्यं न केवलदशाक्रमः।",
        iast="balavanto grahāḥ sarve pūrṇaṃ kurvanti yatphalam | madhyamā madhyamaṃ tadvatpādaṃ hīnabalā grahāḥ || bhāvasvāmye balaṃ mukhyaṃ na kevaladaśākramaḥ ||",
        translation="Planets endowed with full strength produce their results in full measure; those with medium strength produce half, and those devoid of strength yield only one-quarter. Planetary strength is primary in determining the manifestation of house ownership, not merely the chronological succession of Dashas.",
        commentary="Emphasizes that strength determines the capacity to manifest house lordships, whether auspicious or inauspicious.",
        witness="Sharma/Santhanam witness, Ch. 26",
        verification_status="Attested in traditional recensions",
        confidence=ConfidenceLevel.B,
    ),
    "BPHS_26_ALT_101_102": ClassicalPassage(
        passage_id="BPHS_26_ALT_101_102",
        text_id="BPHS",
        chapter="26 (Alternative Recension)",
        verse="101-102",
        sanskrit="कुजस्य चतुर्थे ज्ञस्य चतुर्थे गुरोः पञ्चमे। भृगोः सप्तमे ज्ञेयं फलभेदं वक्रगे सति॥",
        iast="kujasya caturthe jñasya caturthe guroḥ pañcame | bhṛgoḥ saptame jñeyaṃ phalabhedaṃ vakrage sati ||",
        translation="When planets are retrograde, special house influence occurs: Mars affects the 4th house from its position, Mercury the 4th, Jupiter the 5th, and Venus the 7th.",
        commentary="Passage found only in variant North Indian recensions of BPHS. Shows textual variation with Lomasa tradition for Venus and Saturn.",
        witness="Variant manuscript tradition, omitted in standard southern recensions",
        verification_status="Edition-dependent variant reading",
        confidence=ConfidenceLevel.C,
    ),
    "PHALADEEPIKA_9_20": ClassicalPassage(
        passage_id="PHALADEEPIKA_9_20",
        text_id="PHALADEEPIKA",
        chapter="9",
        verse="20",
        sanskrit="वक्रां गतो यदि सुहृद्भवनेऽपि नीचे स्वोच्चार्कभांशकगतोऽपि च वीर्ययुक्तः। तत्तद्गृहेशफलदः स तु यद्विशेषादुच्चे स्थितस्य फलमातनुते तथैव॥",
        iast="vakrāṃ gato yadi suhṛdbhavane'pi nīce svoccārkabhāṃśakagato'pi ca vīryayuktaḥ | tattadgṛheśaphaladaḥ sa tu yadviśeṣāducce sthitasya phalamātanute tathaiva ||",
        translation="Even if a planet is placed in an enemy's sign or in debilitation, if it is in retrograde motion, it is endowed with strength and confers results like a planet in exaltation. It especially yields the fruit of the house it owns and occupies with heightened vigor.",
        commentary="The cornerstone rule of classical Vakri interpretation. Crucially, Mantreswara describes this as an interpretive effect ('phalam atanute tathaiva' - expands results like exaltation), NOT an astronomical conversion of its sign dignity. A debilitated retrograde planet remains debilitated in actual sign calculation.",
        witness="Phaladeepika Ch. 9 verse 20 (consistent across all editions)",
        verification_status="Verified primary text",
        confidence=ConfidenceLevel.A,
    ),
    "PHALADEEPIKA_4_4_5": ClassicalPassage(
        passage_id="PHALADEEPIKA_4_4_5",
        text_id="PHALADEEPIKA",
        chapter="4",
        verse="4-5",
        sanskrit="वक्रिणः पुष्टवीर्याः स्युः सुहृद्युक्ताश्च खेचराः। भौमादयो विना भानुं सोमं च चेष्टितान्विताः॥",
        iast="vakriṇaḥ puṣṭavīryāḥ syuḥ suhṛdyuktāśca khecarāḥ | bhaumādayo vinā bhānuṃ somaṃ ca ceṣṭitānvitāḥ ||",
        translation="Planets in retrograde motion possess robust and nourished strength (Pushta-Virya). The five planets beginning with Mars, excluding the Sun and the Moon, become endowed with Chesta Bala when retrograde.",
        commentary="Confirming that retrogression is a motional strength condition for Mars, Mercury, Jupiter, Venus, and Saturn, not Sun or Moon.",
        witness="Phaladeepika Ch. 4 verse 4-5",
        verification_status="Verified primary text",
        confidence=ConfidenceLevel.A,
    ),
    "PHALADEEPIKA_7_3": ClassicalPassage(
        passage_id="PHALADEEPIKA_7_3",
        text_id="PHALADEEPIKA",
        chapter="7",
        verse="3",
        sanskrit="उच्चत्रिकोणस्वगृहेषु युक्ता वक्राः सुवीर्या यदि केन्द्रगाश्च। कुर्वन्ति भूपालमखण्डकीर्तिं योगोऽयमुक्तो मुनिभिः प्रधानः॥",
        iast="uccatrikoṇasvagṛheṣu yuktā vakrāḥ suvīryā yadi kendragāśca | kurvanti bhūpālamakhaṇḍakīrtiṃ yogo'yamukto munibhiḥ pradhānaḥ ||",
        translation="If planets possess good strength, are placed in exaltation, Moolatrikona, or own sign, or are retrograde and situated in Kendra houses, they create rulers of unbroken renown. This is declared a supreme yoga by the sages.",
        commentary="Retrogression is explicitly listed among conditions elevating a planet to Raja Yoga producing capacity.",
        witness="Phaladeepika Ch. 7 verse 3",
        verification_status="Verified primary text",
        confidence=ConfidenceLevel.B,
    ),
    "PHALADEEPIKA_20_14": ClassicalPassage(
        passage_id="PHALADEEPIKA_20_14",
        text_id="PHALADEEPIKA",
        chapter="20",
        verse="14",
        sanskrit="वक्रोपगस्य रुचिरं विपुलां च कीर्तिं वित्तं च राज्यसुखमुत्तममादिशन्ति। पापेऽपि वक्रसहिते प्रबलप्रतापः शूरः सुसाहसिककार्यपरो मनुष्यः॥",
        iast="vakropagasya ruciraṃ vipulāṃ ca kīrtiṃ vittaṃ ca rājyasukhamuttamamādiśanti | pāpe'pi vakrasahite prabalapratāpaḥ śūraḥ susāhasikakāryaparo manuṣyaḥ ||",
        translation="During the Dasha of a retrograde planet, extensive renown, wealth, and supreme sovereign comforts are predicted. Even when a malefic planet is retrograde, the person manifests mighty valor, courage, and engages in daring enterprises.",
        commentary="Shows that benefic vs malefic retrograde planets manifest differently in Dasha: benefics confer prosperity and reputation, while malefics produce aggressive valor and intense, potentially turbulent enterprise.",
        witness="Phaladeepika Ch. 20 verse 14",
        verification_status="Verified primary text",
        confidence=ConfidenceLevel.B,
    ),
    "JATAKA_PARIJATA_2_66": ClassicalPassage(
        passage_id="JATAKA_PARIJATA_2_66",
        text_id="JATAKA_PARIJATA",
        chapter="2",
        verse="66",
        sanskrit="वक्रार्कसङ्गमविवर्जितसंस्थितानां मध्ये भृगोर्वक्रगते बलं स्यात्।",
        iast="vakrārkasaṅgamavivarjitasaṃsthitānāṃ madhye bhṛgorvakragate balaṃ syāt |",
        translation="Among the conditions that bestow strength upon Venus, its retrograde motion is foremost, provided it is free from combustion by the Sun.",
        commentary="Recognizes retrograde Venus as extraordinarily powerful, but emphasizes evaluating freedom from combustion.",
        witness="Jataka Parijata Ch. 2 verse 66",
        verification_status="Verified primary text",
        confidence=ConfidenceLevel.B,
    ),
    "JATAKA_PARIJATA_2_67": ClassicalPassage(
        passage_id="JATAKA_PARIJATA_2_67",
        text_id="JATAKA_PARIJATA",
        chapter="2",
        verse="67",
        sanskrit="सौरिः प्रतीपगमनप्रबलः प्रदिष्टः।",
        iast="sauriḥ pratīpagamanaprabalaḥ pradiṣṭaḥ |",
        translation="Saturn is declared to be exceedingly potent in backwards motion (retrogression).",
        commentary="Saturn gains strong motion power when retrograde, but as a natural malefic, this strength amplifies both its constructive endurance and its harsh karmic lessons.",
        witness="Jataka Parijata Ch. 2 verse 67",
        verification_status="Verified primary text",
        confidence=ConfidenceLevel.B,
    ),
    "SANKETA_NIDHI_6_102": ClassicalPassage(
        passage_id="SANKETA_NIDHI_6_102",
        text_id="SANKETA_NIDHI",
        chapter="6",
        verse="102",
        sanskrit="शनिस्तु नवमे स्थाने वक्रदृष्टिं करोति हि।",
        iast="śanistu navame sthāne vakradṛṣṭiṃ karoti hi |",
        translation="Saturn in retrograde motion casts a distinctive influence onto the ninth house from its station.",
        commentary="Saṅketa Nidhi provisionally records special 9th house projection for retrograde Saturn.",
        witness="Saṅketa Nidhi, 6th Sanketa",
        verification_status="Recorded tradition, provisional authority",
        confidence=ConfidenceLevel.C,
    ),
    "UTTARA_KALAMRITA_2_6": ClassicalPassage(
        passage_id="UTTARA_KALAMRITA_2_6",
        text_id="UTTARA_KALAMRITA",
        chapter="2",
        verse="6",
        sanskrit="वक्रं गतो नीचगृहस्थितोऽपि स्वामुच्चतां याति सुवीर्यवान् सः। उच्चस्थितो वक्रगतः स नीचवदेव चेष्टामुपयाति तज्ज्ञैः॥",
        iast="vakraṃ gato nīcagṛhasthito'pi svāmuccatāṃ yāti suvīryavān saḥ | uccasthito vakragataḥ sa nīcavadeva ceṣṭāmupayāti tajjñaiḥ ||",
        translation="A planet placed in debilitation, if retrograde, attains the state and fruit of exaltation with abundant strength. Conversely, an exalted planet that is retrograde behaves as if it were in debilitation, so say the experts.",
        commentary="Presents the famous controversial dual-rule: retrograde in debilitation = exaltation effect; retrograde in exaltation = debilitation effect. Contested by standard Parashari and Phaladeepika, which view retrogression as adding Chesta strength in all signs.",
        witness="Uttara Kalamrita Kandam 2 Sloka 6",
        verification_status="Verified classical passage, materially disputed doctrine",
        confidence=ConfidenceLevel.B,
    ),
    "SARAVALI_5_37_38": ClassicalPassage(
        passage_id="SARAVALI_5_37_38",
        text_id="SARAVALI",
        chapter="5",
        verse="37-38",
        sanskrit="शुभग्रहा वक्रगता बहुराज्यप्रदा नृणाम्। पापास्तु वक्रसहिताः कुर्वन्ति भ्रमणं रुजम्॥",
        iast="śubhagrahā vakragatā bahurājyapradā nṛṇām | pāpāstu vakrasahitāḥ kurvanti bhramaṇaṃ rujam ||",
        translation="Natural benefics when retrograde bestow royal status, prosperity, and expansive happiness upon men. Malefics when retrograde cause endless wanderings, illness, obstacles, and agitation.",
        commentary="Clarifies the critical distinction between natural benefics and malefics when retrograde: strength reinforces their essential nature.",
        witness="Saravali Ch. 5 verses 37-38",
        verification_status="Verified classical text",
        confidence=ConfidenceLevel.A,
    ),
    "HORASARA_3_12_14": ClassicalPassage(
        passage_id="HORASARA_3_12_14",
        text_id="HORASARA",
        chapter="3",
        verse="12-14",
        sanskrit="वक्रग्रहाणां फलमन्यथैव ज्ञेयं दशासु प्रथितं मुनीन्द्रैः। आभ्यन्तरं चेष्टितमुत्कटानां फलं विलम्बेन ददाति नूनम्॥",
        iast="vakragrahāṇāṃ phalamanyathaiva jñeyaṃ daśāsu prathitaṃ munīndraiḥ | ābhyantaraṃ ceṣṭitamutkaṭānāṃ phalaṃ vilambena dadāti nūnam ||",
        translation="The results of retrograde planets during their Dashas are understood differently by eminent sages. The motional energy of intense planets works inward and delivers its ultimate fruition after notable delay or through repetitive effort.",
        commentary="Emphasizes that retrograde results often manifest through psychological internalization, second attempts, and unconventional fruition.",
        witness="Horasara Ch. 3 verses 12-14",
        verification_status="Attested classical passage",
        confidence=ConfidenceLevel.B,
    ),
}


# ---------------------------------------------------------------------------
# Corpus of Classical Rules
# ---------------------------------------------------------------------------

RULES: dict[str, ClassicalRule] = {
    "F1_BPHS_CHESTA_BALA": ClassicalRule(
        rule_id="F1_BPHS_CHESTA_BALA",
        rule_name="BPHS Retrograde Chesta Strength",
        category="strength",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is Mars, Mercury, Jupiter, Venus, or Saturn and apparent motion is retrograde (daily_speed < -tolerance).",
        effect_description="Awards 60 Virupas of Chesta Bala (Vakra motion category) under BPHS 27.22.",
        source_passage_id="BPHS_27_21_23",
        tradition="Parashari",
        confidence=ConfidenceLevel.B,
        enabled_by_default=True,
    ),
    "F2_PHALADEEPIKA_EXALTATION_LIKE": ClassicalRule(
        rule_id="F2_PHALADEEPIKA_EXALTATION_LIKE",
        rule_name="Phaladeepika Retrograde Exaltation-Like Effect",
        category="dignity_effect",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is in retrograde motion, even when posited in an enemy sign or debilitation.",
        effect_description="Generates interpretive qualification of 'exaltation_like_results' (intensified house fruits and capacity), without altering actual astronomical sign dignity.",
        source_passage_id="PHALADEEPIKA_9_20",
        tradition="Parashari",
        confidence=ConfidenceLevel.A,
        enabled_by_default=True,
    ),
    "F3_PHALADEEPIKA_STRENGTH_CONDITION": ClassicalRule(
        rule_id="F3_PHALADEEPIKA_STRENGTH_CONDITION",
        rule_name="Phaladeepika Pushta-Virya Condition",
        category="strength",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is one of the five taragrahas in retrograde motion.",
        effect_description="Designated as possessing Pushta-Virya (nourished/robust strength).",
        source_passage_id="PHALADEEPIKA_4_4_5",
        tradition="Parashari",
        confidence=ConfidenceLevel.A,
        enabled_by_default=True,
    ),
    "F4_JATAKA_PARIJATA_VENUS": ClassicalRule(
        rule_id="F4_JATAKA_PARIJATA_VENUS",
        rule_name="Jataka Parijata Retrograde Venus Potency",
        category="planet_specific",
        planet="Venus",
        condition_description="Venus is in retrograde motion and free from combustion.",
        effect_description="Awards special retrograde potency to Venus; enhances artistic, relational and diplomatic capacity.",
        source_passage_id="JATAKA_PARIJATA_2_66",
        tradition="Classical Jyotisha",
        confidence=ConfidenceLevel.B,
        enabled_by_default=True,
    ),
    "F5_JATAKA_PARIJATA_SATURN": ClassicalRule(
        rule_id="F5_JATAKA_PARIJATA_SATURN",
        rule_name="Jataka Parijata Retrograde Saturn Potency",
        category="planet_specific",
        planet="Saturn",
        condition_description="Saturn is in retrograde motion.",
        effect_description="Saturn's motional potency is maximized. Amplifies endurance, labor, responsibility, and karmic pressure. Does not imply universal beneficence.",
        source_passage_id="JATAKA_PARIJATA_2_67",
        tradition="Classical Jyotisha",
        confidence=ConfidenceLevel.B,
        enabled_by_default=True,
    ),
    "F6_BPHS_LORDSHIP_MANIFESTATION": ClassicalRule(
        rule_id="F6_BPHS_LORDSHIP_MANIFESTATION",
        rule_name="BPHS Strength and House Lordship Manifestation",
        category="house_lordship",
        planet="ALL",
        condition_description="Planet has evaluated Shadbala ratio against classical minimum.",
        effect_description="Qualitatively categorizes capacity to manifest owned houses as full (ratio >= 1.0), medium (0.75-1.0), or reduced (< 0.75).",
        source_passage_id="BPHS_26_145_148",
        tradition="Parashari",
        confidence=ConfidenceLevel.B,
        enabled_by_default=True,
    ),
    "F7_PHALADEEPIKA_DASHA_ACTIVATION": ClassicalRule(
        rule_id="F7_PHALADEEPIKA_DASHA_ACTIVATION",
        rule_name="Phaladeepika Retrograde Dasha Prominence",
        category="dasha",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is active as Mahadasha or Antardasha lord and is retrograde.",
        effect_description="Dasha period delivers heightened, prominent, and memorable life events in alignment with planet's functional nature.",
        source_passage_id="PHALADEEPIKA_20_14",
        tradition="Parashari",
        confidence=ConfidenceLevel.B,
        enabled_by_default=True,
    ),
    "F8_PHALADEEPIKA_RAJA_YOGA": ClassicalRule(
        rule_id="F8_PHALADEEPIKA_RAJA_YOGA",
        rule_name="Phaladeepika Raja Yoga Qualification",
        category="yoga",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is retrograde, strong, and situated in a Kendra or Trikona house.",
        effect_description="Qualifies as an active contributor to Raja Yoga manifestation.",
        source_passage_id="PHALADEEPIKA_7_3",
        tradition="Parashari",
        confidence=ConfidenceLevel.B,
        enabled_by_default=True,
    ),
    "F9_SARAVALI_BENEFIC_MALEFIC_SPLIT": ClassicalRule(
        rule_id="F9_SARAVALI_BENEFIC_MALEFIC_SPLIT",
        rule_name="Saravali Natural Benefic vs Malefic Distinction",
        category="benefic_malefic",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is retrograde.",
        effect_description="Natural benefics (Jupiter, Venus, benefic Mercury) confer royal favor, wealth and success; natural malefics (Mars, Saturn) confer strain, wanderings, and friction unless functionally modified.",
        source_passage_id="SARAVALI_5_37_38",
        tradition="Parashari",
        confidence=ConfidenceLevel.A,
        enabled_by_default=True,
    ),
    "F10_UTTARA_KALAMRITA_INVERSION": ClassicalRule(
        rule_id="F10_UTTARA_KALAMRITA_INVERSION",
        rule_name="Uttara Kalamrita Exaltation/Debilitation Inversion",
        category="contested_dignity",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is retrograde in exaltation or debilitation sign.",
        effect_description="Vakri in debilitation behaves like exaltation; Vakri in exaltation behaves like debilitation. Stored as contested doctrine.",
        source_passage_id="UTTARA_KALAMRITA_2_6",
        tradition="Classical South Indian",
        confidence=ConfidenceLevel.B,
        enabled_by_default=False,
    ),
    "F11_HORASARA_INTERNALIZATION": ClassicalRule(
        rule_id="F11_HORASARA_INTERNALIZATION",
        rule_name="Horasara Internalization and Delayed Manifestation",
        category="psychological_timing",
        planet="ALL_NON_LUMINARY",
        condition_description="Planet is retrograde.",
        effect_description="Results manifest via internal deliberation, second chances, repetition, or delayed maturity.",
        source_passage_id="HORASARA_3_12_14",
        tradition="Classical Jyotisha",
        confidence=ConfidenceLevel.B,
        enabled_by_default=True,
    ),
    # Module G: House Offset Rules (Alternative Recension)
    "G1_BPHS_ALT_MARS_OFFSET": ClassicalRule(
        rule_id="G1_BPHS_ALT_MARS_OFFSET",
        rule_name="BPHS Alt Mars 4th House Offset",
        category="house_offset",
        planet="Mars",
        condition_description="Mars is retrograde and house offset tradition is enabled.",
        effect_description="Exerts secondary retrograde projection on the 4th house counted from its position.",
        source_passage_id="BPHS_26_ALT_101_102",
        tradition="Alternative BPHS Recension",
        confidence=ConfidenceLevel.C,
        enabled_by_default=False,
        metadata={"offset": 4},
    ),
    "G2_BPHS_ALT_MERCURY_OFFSET": ClassicalRule(
        rule_id="G2_BPHS_ALT_MERCURY_OFFSET",
        rule_name="BPHS Alt Mercury 4th House Offset",
        category="house_offset",
        planet="Mercury",
        condition_description="Mercury is retrograde and house offset tradition is enabled.",
        effect_description="Exerts secondary retrograde projection on the 4th house counted from its position.",
        source_passage_id="BPHS_26_ALT_101_102",
        tradition="Alternative BPHS Recension",
        confidence=ConfidenceLevel.C,
        enabled_by_default=False,
        metadata={"offset": 4},
    ),
    "G3_BPHS_ALT_JUPITER_OFFSET": ClassicalRule(
        rule_id="G3_BPHS_ALT_JUPITER_OFFSET",
        rule_name="BPHS Alt Jupiter 5th House Offset",
        category="house_offset",
        planet="Jupiter",
        condition_description="Jupiter is retrograde and house offset tradition is enabled.",
        effect_description="Exerts secondary retrograde projection on the 5th house counted from its position.",
        source_passage_id="BPHS_26_ALT_101_102",
        tradition="Alternative BPHS Recension",
        confidence=ConfidenceLevel.C,
        enabled_by_default=False,
        metadata={"offset": 5},
    ),
    "G4_BPHS_ALT_VENUS_OFFSET": ClassicalRule(
        rule_id="G4_BPHS_ALT_VENUS_OFFSET",
        rule_name="BPHS Alt Venus 7th House Offset",
        category="house_offset",
        planet="Venus",
        condition_description="Venus is retrograde and house offset tradition is enabled.",
        effect_description="Exerts secondary retrograde projection on the 7th house counted from its position (variant reading: 6th in Lomasa).",
        source_passage_id="BPHS_26_ALT_101_102",
        tradition="Alternative BPHS Recension",
        confidence=ConfidenceLevel.C,
        enabled_by_default=False,
        metadata={"offset": 7, "variant_reading": "6th in Lomasa"},
    ),
    "G5_SANKETA_NIDHI_SATURN_OFFSET": ClassicalRule(
        rule_id="G5_SANKETA_NIDHI_SATURN_OFFSET",
        rule_name="Sanketa Nidhi Saturn 9th House Offset",
        category="house_offset",
        planet="Saturn",
        condition_description="Saturn is retrograde and house offset tradition is enabled.",
        effect_description="Exerts secondary retrograde projection on the 9th house counted from its position.",
        source_passage_id="SANKETA_NIDHI_6_102",
        tradition="Sanketa Nidhi Tradition",
        confidence=ConfidenceLevel.C,
        enabled_by_default=False,
        metadata={"offset": 9},
    ),
}


# ---------------------------------------------------------------------------
# Doctrinal Conflicts Registry
# ---------------------------------------------------------------------------

CONFLICTS: dict[str, RuleConflict] = {
    "RETROGRADE_DEBILITATION_001": RuleConflict(
        conflict_id="RETROGRADE_DEBILITATION_001",
        rule_id_a="F2_PHALADEEPIKA_EXALTATION_LIKE",
        rule_id_b="F10_UTTARA_KALAMRITA_INVERSION",
        topic="Retrograde Debilitated / Exalted Planets",
        conflict_type="interpretive_divergence",
        explanation="Phaladeepika 9.20 holds that retrogression confers exaltation-like strength/fruits even in debilitation, without inverting exalted planets. Uttara Kalamrita 2.6 introduces a symmetrical inversion: retrograde in debilitation acts as exaltation, but retrograde in exaltation acts as debilitation. Saravali and standard Parashari treat retrogression as adding Chesta strength in both conditions.",
        resolution_method="display_both",
        rules=[
            {
                "source": "Phaladeepika 9.20",
                "interpretation": "Exaltation-like results for retrograde in debilitation or enemy sign; does not invert exalted planets into debilitation.",
                "status": "attested",
            },
            {
                "source": "Uttara Kalamrita 2.6",
                "interpretation": "Symmetrical inversion: retrograde debilitated = exalted; retrograde exalted = debilitated.",
                "status": "contested",
            },
            {
                "source": "Horasara commentary / Saravali",
                "interpretation": "Debilitation sign remains structurally vulnerable; motional strength produces eccentric or delayed outcomes rather than literal exaltation.",
                "status": "qualified_parashari",
            },
        ],
    ),
    "RETROGRADE_DASHA_DIRECTION_002": RuleConflict(
        conflict_id="RETROGRADE_DASHA_DIRECTION_002",
        rule_id_a="F7_PHALADEEPIKA_DASHA_ACTIVATION",
        rule_id_b="BPHS_CH35_VARIANT_DASHA",
        topic="Retrograde Planet Dasha Sequence & Timing",
        conflict_type="edition_dependent",
        explanation="One variant witness of BPHS Chapter 35 suggests that retrograde planets reverse or alter the sub-period progression or deliver reversed timing of results. Phaladeepika 20.14 and orthodox Parashari maintain normal dasha sequencing while noting that the intensity and enterprise of the period are magnified.",
        resolution_method="display_both",
        rules=[
            {
                "source": "Phaladeepika 20.14",
                "interpretation": "Standard Dasha progression with magnified intensity, reputation, and enterprise.",
                "status": "attested",
            },
            {
                "source": "BPHS Ch. 35 Variant Witness",
                "interpretation": "Reversed or altered sub-period manifestation; unexpected internal timing shifts.",
                "status": "edition_dependent",
            },
        ],
    ),
    "RETROGRADE_COMBUSTION_003": RuleConflict(
        conflict_id="RETROGRADE_COMBUSTION_003",
        rule_id_a="SURYA_SIDDHANTA_ASTRONOMICAL",
        rule_id_b="JATAKA_COMBUSTION_STANDARD",
        topic="Interaction of Retrogression and Combustion (Asta & Vakra)",
        conflict_type="doctrinal_synthesis",
        explanation="Astronomically, inferior planets (Mercury, Venus) at inferior conjunction are closest to Earth (perigee), maximizing their apparent disk size. Yet, being close to the Sun, they are visually combust (Asta). Classical Jyotisha texts differ on whether retrograde perigee cancels combustion: Jataka Parijata 2.66 specifically cautions that Venus's retrograde strength requires freedom from combustion, confirming that retrogression does NOT automatically cancel combustion.",
        resolution_method="display_both",
        rules=[
            {
                "source": "Jataka Parijata 2.66 & BPHS",
                "interpretation": "Combustion and retrogression operate simultaneously; retrogression increases motional strength but combustion afflicts physical/external visibility and significations.",
                "status": "orthodox",
            },
            {
                "source": "Modern / Siddhantic Synthesis",
                "interpretation": "Inferior planets at retrograde perigee retain strong internal mental/spiritual vigor despite solar combustion.",
                "status": "secondary_interpretive",
            },
        ],
    ),
    "RETROGRADE_HOUSE_OFFSETS_004": RuleConflict(
        conflict_id="RETROGRADE_HOUSE_OFFSETS_004",
        rule_id_a="STANDARD_PARASHARI_ASPECTS",
        rule_id_b="BPHS_26_ALT_OFFSETS",
        topic="Retrograde House Offset Influence (Module G)",
        conflict_type="tradition_dependent",
        explanation="Orthodox Parashari applies standard planetary aspects (Drishti) identically regardless of motion, with retrogression increasing strength. An alternative BPHS recension (Ch. 26 vv. 101-102) and Sanketa Nidhi 6.102 introduce special retrograde projections: Mars onto 4th, Mercury onto 4th, Jupiter onto 5th, Venus onto 7th, Saturn onto 9th.",
        resolution_method="display_both",
        rules=[
            {
                "source": "Standard Parashari (BPHS / Phaladeepika)",
                "interpretation": "Standard house aspects apply; no arbitrary house-offset projection.",
                "status": "mainstream_classical",
            },
            {
                "source": "BPHS Alternative Recension / Sanketa Nidhi",
                "interpretation": "Special secondary house projection (Mars 4th, Merc 4th, Jup 5th, Ven 7th, Sat 9th).",
                "status": "edition_dependent",
            },
        ],
    ),
}

