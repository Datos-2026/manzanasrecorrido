import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { visitsApi } from '../api/visitsApi';
import { assignmentsApi } from '../api/assignmentsApi';
import { todayISO } from '../utils/dates';
import { useGeolocation } from '../hooks/useGeolocation';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import SectionCard from '../components/ui/SectionCard';
import FormField from '../components/ui/FormField';
import SegmentedControl from '../components/ui/SegmentedControl';
import RadioGroup from '../components/ui/RadioGroup';
import PhotoCapture from '../components/ui/PhotoCapture';
import MultiPhotoCapture from '../components/ui/MultiPhotoCapture';
import GpsChip from '../components/ui/GpsChip';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';

const FRONT_TYPES = [
  'Casa',
  'PH',
  'Edificio con encargado',
  'Edificio sin encargado',
  'Gastronómico',
  'Verdulería',
  'Carnicería',
  'Venta de productos',
  'Kiosco',
  'Indumentaria',
  'Servicios',
  'Escuela',
  'Garage',
  'Iglesia',
  'Hospital',
  'Baldío',
  'Club de barrio',
  'Frente comercial vacío',
  'Otro',
];

const SCHEDULE_OPTIONS = [
  { value: '10-15', label: '10 a 15 h' },
  { value: '15-19', label: '15 a 19 h' },
  { value: '19-21', label: '19 a 21 h' },
  { value: '21-10', label: '21 a 10 h del día siguiente' },
];

const VOLUMINOUS_OPTIONS = [
  { value: 'boti', label: 'BOTI' },
  { value: '147', label: '147' },
  { value: 'contenedor', label: 'Al lado del contenedor' },
  { value: 'otro', label: 'Otro' },
];

const SEPARATES_OPTIONS = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'a_veces', label: 'A veces' },
];

const RECYCLE_OPTIONS = [
  { value: 'verde', label: 'Contenedor verde' },
  { value: 'punto_verde', label: 'Punto verde' },
  { value: 'recuperador', label: 'Recuperador urbano' },
  { value: 'cestos', label: 'Cestos del edificio' },
  { value: 'no_separa', label: 'No separa' },
  { value: 'otro', label: 'Otro' },
];

const BLOCK_HYGIENE_OPTIONS = [
  { value: 'muy_buena', label: 'Muy buena' },
  { value: 'buena', label: 'Buena' },
  { value: 'regular', label: 'Regular' },
  { value: 'mala', label: 'Mala' },
  { value: 'muy_mala', label: 'Muy mala' },
];

const SCATTERED_OPTIONS = [
  { value: 'todos_los_dias', label: 'Sí, todos los días' },
  { value: 'a_veces', label: 'A veces' },
  { value: 'nunca', label: 'No, nunca' },
];

const SPOKE_WITH_OPTIONS = [
  { value: 'vecino', label: 'Vecino/a' },
  { value: 'encargado', label: 'Encargado' },
  { value: 'comerciante', label: 'Comerciante' },
  { value: 'no_atendio', label: 'No atendió' },
  { value: 'no_quiere', label: 'No quiere ser contactado' },
];

const FINAL_NO_ANSWERS = ['no_atendio', 'no_quiere'];

const HYGIENE_TREND_OPTIONS = [
  { value: 'mejoro', label: 'Mejoró' },
  { value: 'igual', label: 'Igual' },
  { value: 'empeoro', label: 'Empeoró' },
  { value: 'otro', label: 'Otro' },
];

const CONTAINER_STATE_OPTIONS = [
  { value: 'limpio', label: 'Limpio y en orden' },
  { value: 'residuos_alrededor', label: 'Con residuos alrededor' },
  { value: 'desbordado', label: 'Desbordado' },
  { value: 'desperfectos', label: 'Con desperfectos' },
  { value: 'otro', label: 'Otro' },
];

const emptySurvey = {
  frontType: '',
  frontTypeOther: '',
  buildingUnits: '',
  hasSidewalkContainer: '',
  containerPhoto: null,
  drainObstructedPhoto: null,
  spokeWith: '',
  contactInfo: '',
  trashSchedule: '',
  noEveningReason: '',
  bagsCount: '',
  voluminousDisposal: '',
  voluminousDisposalOther: '',
  separatesWaste: '',
  recyclingPlace: '',
  recyclingPlaceOther: '',
  blockHygiene: '',
  scatteredTrash: '',
  hasBadBehavior: '',
  badBehaviorDescription: '',
};

const emptyFollowUp = {
  spokeWith: '',
  hygieneTrend: '',
  hygieneTrendOther: '',
  scatteredAroundContainer: '',
  scatteredSchedule: '',
  bulkyOrRubble: '',
  flyerPosted: '',
  flyerFeedback: '',
  behaviorsToCorrect: '',
  containerState: '',
  containerStateOther: '',
  containerPhotos: [],
  hasIncidents: '',
  incidentsDescription: '',
  observations: '',
};

export default function NewVisitPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const blockIdParam = searchParams.get('blockId');

  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const gps = useGeolocation(true);

  const [form, setForm] = useState({
    visitDate: todayISO(),
    startTime: '',
    endTime: '',
    status: 'realizado',
    couldVisit: true,
    reasonNotVisited: '',
    generalNotes: '',
    street: '',
    streetNumber: '',
    doorbell: '',
    survey: { ...emptySurvey },
    followUp: { ...emptyFollowUp },
  });

  useEffect(() => {
    assignmentsApi
      .myBlocks()
      .then((data) => {
        if (!data || data.length === 0) {
          setNotFound(true);
          return;
        }
        if (blockIdParam) {
          const found = data.find((b) => b.id === blockIdParam);
          if (found) {
            setBlock(found);
          } else {
            setNotFound(true);
          }
          return;
        }
        if (data.length === 1) {
          setBlock(data[0]);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [blockIdParam]);

  if (!loading && (notFound || !block)) {
    return <Navigate to="/mis-manzanas" replace />;
  }

  const weekNumber = block?.nextWeekNumber || 1;
  const isInitial = weekNumber === 1;
  const completed = block?.completed;

  const setSurvey = (key, value) => {
    setForm((f) => ({ ...f, survey: { ...f.survey, [key]: value } }));
  };
  const setFollowUp = (key, value) => {
    setForm((f) => ({ ...f, followUp: { ...f.followUp, [key]: value } }));
  };

  const isBuilding = ['Edificio con encargado', 'Edificio sin encargado', 'PH'].includes(
    form.survey.frontType
  );
  const isCommerceOrBuilding =
    isBuilding ||
    [
      'Gastronómico',
      'Verdulería',
      'Carnicería',
      'Venta de productos',
      'Kiosco',
      'Indumentaria',
      'Servicios',
      'Frente comercial vacío',
    ].includes(form.survey.frontType);

  const endsEarlyInitial = FINAL_NO_ANSWERS.includes(form.survey.spokeWith);
  const endsEarlyFollow = FINAL_NO_ANSWERS.includes(form.followUp.spokeWith);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let surveyPayload;
      let hygienePayload;
      let photos;

      if (isInitial) {
        photos = [form.survey.containerPhoto, form.survey.drainObstructedPhoto].filter(Boolean);
        surveyPayload = { kind: 'inicial', ...form.survey };
        hygienePayload = {
          trashProperlyDisposed: form.survey.hasSidewalkContainer === 'si',
          trashOutOfSchedule:
            form.survey.trashSchedule === '21-10' || form.survey.trashSchedule === '10-15',
          bulkyWaste: form.survey.voluminousDisposal === 'contenedor',
          rubble: false,
          overflowingContainers: form.survey.scatteredTrash === 'todos_los_dias',
          criticalPoint: ['mala', 'muy_mala'].includes(form.survey.blockHygiene),
          criticalPointDescription:
            form.survey.hasBadBehavior === 'si' ? form.survey.badBehaviorDescription : null,
          photos,
          notes: form.survey.contactInfo || null,
        };
      } else {
        photos = form.followUp.containerPhotos || [];
        surveyPayload = { kind: 'seguimiento', ...form.followUp };
        hygienePayload = {
          trashProperlyDisposed: form.followUp.containerState === 'limpio',
          trashOutOfSchedule: form.followUp.bulkyOrRubble === 'si',
          bulkyWaste: form.followUp.bulkyOrRubble === 'si',
          rubble: form.followUp.bulkyOrRubble === 'si',
          overflowingContainers: ['desbordado', 'residuos_alrededor'].includes(
            form.followUp.containerState
          ),
          criticalPoint:
            form.followUp.hygieneTrend === 'empeoro' || form.followUp.hasIncidents === 'si',
          criticalPointDescription:
            form.followUp.hasIncidents === 'si' ? form.followUp.incidentsDescription : null,
          photos,
          notes: form.followUp.observations || null,
        };
      }

      const payload = {
        blockId: block.id,
        visitDate: form.visitDate,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        status: form.status,
        couldVisit: form.couldVisit,
        reasonNotVisited: form.couldVisit ? null : form.reasonNotVisited || null,
        generalNotes: form.generalNotes || null,
        latitude: gps.coords?.latitude ?? null,
        longitude: gps.coords?.longitude ?? null,
        street: form.street || null,
        streetNumber: form.streetNumber || null,
        doorbell: form.doorbell || null,
        weekNumber,
        surveyData: surveyPayload,
        hygieneObservation: hygienePayload,
      };

      await visitsApi.create(payload);
      navigate('/recorridos');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="Cargar recorrido" backTo="/mis-manzanas" />
        <LoadingState />
      </>
    );
  }

  if (completed) {
    return (
      <>
        <MobileHeader title="Recorrido" backTo="/mis-manzanas" subtitle={block.code} />
        <PageContainer narrow>
          <SectionCard label={block.code} title="Manzana ya cerrada" noDivider>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-muted)' }}>
              Ya se completaron las 5 semanas de relevamiento para esta manzana. No es necesario
              cargar nuevos recorridos.
            </p>
            <SecondaryButton block onClick={() => navigate('/mis-manzanas')}>
              Volver a mis manzanas
            </SecondaryButton>
          </SectionCard>
        </PageContainer>
      </>
    );
  }

  const headerSubtitle = `${block.code} · Semana ${weekNumber} de 5`;

  return (
    <>
      <MobileHeader
        title={isInitial ? 'Primer relevamiento' : `Relevamiento ${weekNumber}`}
        backTo="/mis-manzanas"
        subtitle={headerSubtitle}
      />
      <PageContainer narrow>
        <ErrorState message={error} />

        <SectionCard label="Manzana del recorrido" title={block.code} noDivider>
          <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-muted)' }}>
            {block.neighborhood || 'Sin barrio'}
            {block.commune?.name ? ` · ${block.commune.name}` : ''}
            {block.label ? ` · ${block.label}` : ''}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="context-pill">Asignada a vos</span>
            <span className="context-pill context-pill--accent">Semana {weekNumber} de 5</span>
            {!isInitial && block.lastVisitDate && (
              <span className="context-pill">Última visita: {block.lastVisitDate}</span>
            )}
          </div>
        </SectionCard>

        <GpsChip {...gps} onRefresh={gps.refetch} />

        <form id="visit-form" onSubmit={handleSubmit}>
          {/* DOMICILIO (común a ambos) */}
          <SectionCard label="Domicilio" title="Datos del domicilio" noDivider>
            <FormField label="Calle" id="street">
              <input
                id="street"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                required
                autoComplete="street-address"
              />
            </FormField>

            <FormField label="Altura (solo número)" id="streetNumber">
              <input
                id="streetNumber"
                type="number"
                inputMode="numeric"
                value={form.streetNumber}
                onChange={(e) => setForm({ ...form, streetNumber: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Timbre (opcional)" id="doorbell">
              <input
                id="doorbell"
                value={form.doorbell}
                onChange={(e) => setForm({ ...form, doorbell: e.target.value })}
              />
            </FormField>
          </SectionCard>

          {isInitial ? (
            <InitialFormSections
              survey={form.survey}
              setSurvey={setSurvey}
              isBuilding={isBuilding}
              isCommerceOrBuilding={isCommerceOrBuilding}
              endsEarly={endsEarlyInitial}
            />
          ) : (
            <FollowUpFormSections
              followUp={form.followUp}
              setFollowUp={setFollowUp}
              endsEarly={endsEarlyFollow}
              weekNumber={weekNumber}
            />
          )}

          <SectionCard title="Estado del recorrido" noDivider>
            <FormField label="Estado">
              <SegmentedControl
                variant="yellow"
                value={form.status}
                onChange={(status) => setForm({ ...form, status })}
                options={[
                  { value: 'realizado', label: 'Realizado' },
                  { value: 'parcial', label: 'Parcial' },
                  { value: 'no_realizado', label: 'No realizado' },
                ]}
              />
            </FormField>
            <FormField label="Fecha" id="visitDate">
              <input
                id="visitDate"
                type="date"
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                required
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Hora inicio" id="startTime">
                <input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </FormField>
              <FormField label="Hora fin" id="endTime">
                <input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Notas generales (opcional)" id="notes">
              <textarea
                id="notes"
                rows={3}
                value={form.generalNotes}
                onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
              />
            </FormField>
          </SectionCard>

          <div style={{ height: 160 }} aria-hidden="true" />
        </form>
      </PageContainer>

      <div className="form-footer-fixed">
        <PrimaryButton type="submit" form="visit-form" large block disabled={saving}>
          {saving ? 'Guardando...' : `Guardar relevamiento (semana ${weekNumber})`}
        </PrimaryButton>
        <SecondaryButton type="button" block onClick={() => navigate(-1)}>
          Cancelar
        </SecondaryButton>
      </div>
    </>
  );
}

function InitialFormSections({ survey, setSurvey, isBuilding, isCommerceOrBuilding, endsEarly }) {
  return (
    <>
      <SectionCard label="Frente" title="Tipo de frente" noDivider>
        <FormField label="Tipo" id="frontType">
          <select
            id="frontType"
            value={survey.frontType}
            onChange={(e) => setSurvey('frontType', e.target.value)}
            required
          >
            <option value="">Seleccionar...</option>
            {FRONT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>

        {survey.frontType === 'Otro' && (
          <FormField label="Especificar" id="frontOther">
            <input
              id="frontOther"
              value={survey.frontTypeOther}
              onChange={(e) => setSurvey('frontTypeOther', e.target.value)}
              required
            />
          </FormField>
        )}

        {isBuilding && (
          <FormField label="Cantidad de departamentos" id="units">
            <input
              id="units"
              type="number"
              inputMode="numeric"
              value={survey.buildingUnits}
              onChange={(e) => setSurvey('buildingUnits', e.target.value)}
            />
          </FormField>
        )}
      </SectionCard>

      <SectionCard label="Vereda" title="Contenedor en la vereda" noDivider>
        <FormField label="¿Tiene contenedor?">
          <RadioGroup
            name="hasContainer"
            value={survey.hasSidewalkContainer}
            onChange={(v) => setSurvey('hasSidewalkContainer', v)}
            options={[
              { value: 'si', label: 'Sí' },
              { value: 'no', label: 'No' },
            ]}
          />
        </FormField>

        {survey.hasSidewalkContainer === 'si' && (
          <PhotoCapture
            label="Foto del contenedor (estado y condiciones)"
            value={survey.containerPhoto}
            onChange={(v) => setSurvey('containerPhoto', v)}
          />
        )}

        <PhotoCapture
          label="Foto de sumideros obstruidos cercanos (si los hay)"
          value={survey.drainObstructedPhoto}
          onChange={(v) => setSurvey('drainObstructedPhoto', v)}
        />
      </SectionCard>

      <SectionCard label="Higiene" title="¿Con quién hablás?" noDivider>
        <RadioGroup
          name="spokeWith"
          columns={1}
          value={survey.spokeWith}
          onChange={(v) => setSurvey('spokeWith', v)}
          options={SPOKE_WITH_OPTIONS}
        />
        {endsEarly && (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            El relevamiento termina acá. Podés guardar el recorrido sin más datos.
          </p>
        )}
      </SectionCard>

      {survey.spokeWith && !endsEarly && (
        <>
          <SectionCard title="Datos del contacto" noDivider>
            <FormField label="Contacto del vecino (opcional)" id="contactInfo">
              <input
                id="contactInfo"
                value={survey.contactInfo}
                onChange={(e) => setSurvey('contactInfo', e.target.value)}
                placeholder="Teléfono o email"
              />
            </FormField>
          </SectionCard>

          <SectionCard title="Manejo de residuos" noDivider>
            <FormField label="¿A qué hora saca la basura?">
              <RadioGroup
                name="trashSchedule"
                columns={1}
                value={survey.trashSchedule}
                onChange={(v) => setSurvey('trashSchedule', v)}
                options={SCHEDULE_OPTIONS}
              />
            </FormField>

            {survey.trashSchedule && survey.trashSchedule !== '19-21' && (
              <FormField label="¿Por qué no la saca de 19 a 21?" id="noEveningReason">
                <textarea
                  id="noEveningReason"
                  rows={2}
                  value={survey.noEveningReason}
                  onChange={(e) => setSurvey('noEveningReason', e.target.value)}
                />
              </FormField>
            )}

            {isCommerceOrBuilding && (
              <FormField label="Cantidad aproximada de bolsas" id="bagsCount">
                <input
                  id="bagsCount"
                  type="number"
                  inputMode="numeric"
                  value={survey.bagsCount}
                  onChange={(e) => setSurvey('bagsCount', e.target.value)}
                />
              </FormField>
            )}

            <FormField label="¿Cómo descarta residuos voluminosos?">
              <RadioGroup
                name="voluminous"
                columns={1}
                value={survey.voluminousDisposal}
                onChange={(v) => setSurvey('voluminousDisposal', v)}
                options={VOLUMINOUS_OPTIONS}
              />
            </FormField>
            {survey.voluminousDisposal === 'otro' && (
              <FormField label="Especificar" id="volOther">
                <input
                  id="volOther"
                  value={survey.voluminousDisposalOther}
                  onChange={(e) => setSurvey('voluminousDisposalOther', e.target.value)}
                />
              </FormField>
            )}
          </SectionCard>

          <SectionCard title="Reciclado" noDivider>
            <FormField label="¿Separa residuos?">
              <RadioGroup
                name="separates"
                value={survey.separatesWaste}
                onChange={(v) => setSurvey('separatesWaste', v)}
                options={SEPARATES_OPTIONS}
                columns={1}
              />
            </FormField>

            <FormField label="¿Dónde dispone los reciclables?">
              <RadioGroup
                name="recycle"
                columns={1}
                value={survey.recyclingPlace}
                onChange={(v) => setSurvey('recyclingPlace', v)}
                options={RECYCLE_OPTIONS}
              />
            </FormField>
            {survey.recyclingPlace === 'otro' && (
              <FormField label="Especificar" id="recOther">
                <input
                  id="recOther"
                  value={survey.recyclingPlaceOther}
                  onChange={(e) => setSurvey('recyclingPlaceOther', e.target.value)}
                />
              </FormField>
            )}
          </SectionCard>

          <SectionCard title="Observación de la cuadra" noDivider>
            <FormField label="¿Cómo ves la higiene de la cuadra?">
              <RadioGroup
                name="blockHygiene"
                columns={1}
                value={survey.blockHygiene}
                onChange={(v) => setSurvey('blockHygiene', v)}
                options={BLOCK_HYGIENE_OPTIONS}
              />
            </FormField>

            <FormField label="¿Suele haber residuos diseminados junto al contenedor?">
              <RadioGroup
                name="scattered"
                columns={1}
                value={survey.scatteredTrash}
                onChange={(v) => setSurvey('scatteredTrash', v)}
                options={SCATTERED_OPTIONS}
              />
            </FormField>

            <FormField label="¿Detectaste conductas a corregir en la cuadra?">
              <RadioGroup
                name="badBehavior"
                value={survey.hasBadBehavior}
                onChange={(v) => setSurvey('hasBadBehavior', v)}
                options={[
                  { value: 'si', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </FormField>

            {survey.hasBadBehavior === 'si' && (
              <FormField label="Describir la conducta a corregir" id="badBehaviorDesc">
                <textarea
                  id="badBehaviorDesc"
                  rows={3}
                  value={survey.badBehaviorDescription}
                  onChange={(e) => setSurvey('badBehaviorDescription', e.target.value)}
                  required
                />
              </FormField>
            )}
          </SectionCard>
        </>
      )}
    </>
  );
}

function FollowUpFormSections({ followUp, setFollowUp, endsEarly, weekNumber }) {
  return (
    <>
      <SectionCard label={`Semana ${weekNumber}`} title="¿Con quién hablás?" noDivider>
        <RadioGroup
          name="followSpokeWith"
          columns={1}
          value={followUp.spokeWith}
          onChange={(v) => setFollowUp('spokeWith', v)}
          options={SPOKE_WITH_OPTIONS}
        />
        {endsEarly && (
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            No se pudo hablar con vecinos. Igual completá la parte del voluntario más abajo y guardá.
          </p>
        )}
      </SectionCard>

      {!endsEarly && followUp.spokeWith && (
        <SectionCard title="Para el/la vecino/a" noDivider>
          <FormField label="La higiene de la cuadra respecto a la visita anterior:">
            <RadioGroup
              name="hygieneTrend"
              columns={2}
              value={followUp.hygieneTrend}
              onChange={(v) => setFollowUp('hygieneTrend', v)}
              options={HYGIENE_TREND_OPTIONS}
            />
          </FormField>
          {followUp.hygieneTrend === 'otro' && (
            <FormField label="Especificar" id="hygieneTrendOther">
              <input
                id="hygieneTrendOther"
                value={followUp.hygieneTrendOther}
                onChange={(e) => setFollowUp('hygieneTrendOther', e.target.value)}
              />
            </FormField>
          )}

          <FormField label="¿Vio diseminados alrededor de los contenedores estos días?">
            <RadioGroup
              name="scatteredContainer"
              value={followUp.scatteredAroundContainer}
              onChange={(v) => setFollowUp('scatteredAroundContainer', v)}
              options={[
                { value: 'si', label: 'Sí' },
                { value: 'no', label: 'No' },
              ]}
            />
          </FormField>

          {followUp.scatteredAroundContainer === 'si' && (
            <FormField label="¿Tiene identificado el horario?" id="scatteredSchedule">
              <input
                id="scatteredSchedule"
                value={followUp.scatteredSchedule}
                onChange={(e) => setFollowUp('scatteredSchedule', e.target.value)}
                placeholder="Ej: a la noche, los lunes a la mañana..."
              />
            </FormField>
          )}

          <FormField label="¿Vio voluminosos, restos de poda o escombros al lado de los contenedores?">
            <RadioGroup
              name="bulkyOrRubble"
              value={followUp.bulkyOrRubble}
              onChange={(v) => setFollowUp('bulkyOrRubble', v)}
              options={[
                { value: 'si', label: 'Sí' },
                { value: 'no', label: 'No' },
              ]}
            />
          </FormField>

          <FormField label="Si dimos flyer la vez anterior: ¿lo pegó en su edificio/comercio?">
            <RadioGroup
              name="flyerPosted"
              value={followUp.flyerPosted}
              onChange={(v) => setFollowUp('flyerPosted', v)}
              options={[
                { value: 'si', label: 'Sí' },
                { value: 'no', label: 'No' },
                { value: 'no_aplica', label: 'No aplica' },
              ]}
              columns={3}
            />
          </FormField>

          {followUp.flyerPosted === 'si' && (
            <FormField label="¿Tuvo alguna repercusión?" id="flyerFeedback">
              <textarea
                id="flyerFeedback"
                rows={2}
                value={followUp.flyerFeedback}
                onChange={(e) => setFollowUp('flyerFeedback', e.target.value)}
              />
            </FormField>
          )}

          <FormField label="Conductas a corregir en la manzana" id="behaviorsToCorrect">
            <textarea
              id="behaviorsToCorrect"
              rows={3}
              value={followUp.behaviorsToCorrect}
              onChange={(e) => setFollowUp('behaviorsToCorrect', e.target.value)}
            />
          </FormField>
        </SectionCard>
      )}

      <SectionCard title="Para el/la voluntario/a" noDivider>
        <FormField label="Estado del contenedor">
          <RadioGroup
            name="containerState"
            columns={1}
            value={followUp.containerState}
            onChange={(v) => setFollowUp('containerState', v)}
            options={CONTAINER_STATE_OPTIONS}
          />
        </FormField>
        {followUp.containerState === 'otro' && (
          <FormField label="Especificar" id="containerStateOther">
            <input
              id="containerStateOther"
              value={followUp.containerStateOther}
              onChange={(e) => setFollowUp('containerStateOther', e.target.value)}
            />
          </FormField>
        )}

        <MultiPhotoCapture
          label="Fotos del contenedor"
          value={followUp.containerPhotos}
          onChange={(v) => setFollowUp('containerPhotos', v)}
          max={10}
        />
      </SectionCard>

      <SectionCard title="Incidencias y seguimiento" noDivider>
        <FormField label="¿Detectaste incidencias en esta visita?">
          <RadioGroup
            name="hasIncidents"
            value={followUp.hasIncidents}
            onChange={(v) => setFollowUp('hasIncidents', v)}
            options={[
              { value: 'si', label: 'Sí' },
              { value: 'no', label: 'No' },
            ]}
          />
        </FormField>
        {followUp.hasIncidents === 'si' && (
          <FormField label="¿Cuáles?" id="incidentsDescription">
            <textarea
              id="incidentsDescription"
              rows={3}
              value={followUp.incidentsDescription}
              onChange={(e) => setFollowUp('incidentsDescription', e.target.value)}
              required
            />
          </FormField>
        )}

        <FormField label="Observaciones" id="observations">
          <textarea
            id="observations"
            rows={3}
            value={followUp.observations}
            onChange={(e) => setFollowUp('observations', e.target.value)}
          />
        </FormField>
      </SectionCard>
    </>
  );
}
