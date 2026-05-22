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
  });

  useEffect(() => {
    assignmentsApi
      .myBlocks()
      .then((data) => {
        if (!data || data.length === 0) {
          setNotFound(true);
          return;
        }
        // Si vino blockId por URL, buscar esa manzana en las asignadas
        if (blockIdParam) {
          const found = data.find((b) => b.id === blockIdParam);
          if (found) {
            setBlock(found);
          } else {
            setNotFound(true);
          }
          return;
        }
        // Sin blockId: si tiene una sola manzana asignada, usarla;
        // si tiene varias, redirigir a "Mis manzanas" para que elija.
        if (data.length === 1) {
          setBlock(data[0]);
        } else {
          setNotFound(true);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockIdParam]);

  // Si no se pudo resolver una manzana, mandamos al listado
  if (!loading && (notFound || !block)) {
    return <Navigate to="/mis-manzanas" replace />;
  }

  const setSurvey = (key, value) => {
    setForm((f) => ({ ...f, survey: { ...f.survey, [key]: value } }));
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

  const endsEarly = FINAL_NO_ANSWERS.includes(form.survey.spokeWith);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const photos = [
        form.survey.containerPhoto,
        form.survey.drainObstructedPhoto,
      ].filter(Boolean);

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
        surveyData: form.survey,
        hygieneObservation: {
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
        },
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

  return (
    <>
      <MobileHeader
        title="Cargar recorrido"
        backTo="/mis-manzanas"
        subtitle={block.code}
      />
      <PageContainer narrow>
        <ErrorState message={error} />

        {/* Contexto fijo: la manzana sobre la que se está cargando el recorrido */}
        <SectionCard label="Manzana del recorrido" title={block.code} noDivider>
          <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-muted)' }}>
            {block.neighborhood || 'Sin barrio'}
            {block.commune?.name ? ` · ${block.commune.name}` : ''}
            {block.label ? ` · ${block.label}` : ''}
          </p>
          <span className="context-pill">Asignada a vos</span>
        </SectionCard>

        <GpsChip {...gps} onRefresh={gps.refetch} />

        <form id="visit-form" onSubmit={handleSubmit}>
          {/* Domicilio */}
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

          {/* Tipo de frente */}
          <SectionCard label="Frente" title="Tipo de frente" noDivider>
            <FormField label="Tipo" id="frontType">
              <select
                id="frontType"
                value={form.survey.frontType}
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

            {form.survey.frontType === 'Otro' && (
              <FormField label="Especificar" id="frontOther">
                <input
                  id="frontOther"
                  value={form.survey.frontTypeOther}
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
                  value={form.survey.buildingUnits}
                  onChange={(e) => setSurvey('buildingUnits', e.target.value)}
                />
              </FormField>
            )}
          </SectionCard>

          {/* Contenedor */}
          <SectionCard label="Vereda" title="Contenedor en la vereda" noDivider>
            <FormField label="¿Tiene contenedor?">
              <RadioGroup
                name="hasContainer"
                value={form.survey.hasSidewalkContainer}
                onChange={(v) => setSurvey('hasSidewalkContainer', v)}
                options={[
                  { value: 'si', label: 'Sí' },
                  { value: 'no', label: 'No' },
                ]}
              />
            </FormField>

            {form.survey.hasSidewalkContainer === 'si' && (
              <PhotoCapture
                label="Foto del contenedor (estado y condiciones)"
                value={form.survey.containerPhoto}
                onChange={(v) => setSurvey('containerPhoto', v)}
              />
            )}

            <PhotoCapture
              label="Foto de sumideros obstruidos cercanos (si los hay)"
              value={form.survey.drainObstructedPhoto}
              onChange={(v) => setSurvey('drainObstructedPhoto', v)}
            />
          </SectionCard>

          {/* Higiene - contacto */}
          <SectionCard label="Higiene" title="¿Con quién hablás?" noDivider>
            <RadioGroup
              name="spokeWith"
              columns={1}
              value={form.survey.spokeWith}
              onChange={(v) => setSurvey('spokeWith', v)}
              options={SPOKE_WITH_OPTIONS}
            />
            {endsEarly && (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                El relevamiento termina acá. Podés guardar el recorrido sin más datos.
              </p>
            )}
          </SectionCard>

          {/* Si hay contacto real, mostramos el resto */}
          {form.survey.spokeWith && !endsEarly && (
            <>
              <SectionCard title="Datos del contacto" noDivider>
                <FormField label="Contacto del vecino (opcional)" id="contactInfo">
                  <input
                    id="contactInfo"
                    value={form.survey.contactInfo}
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
                    value={form.survey.trashSchedule}
                    onChange={(v) => setSurvey('trashSchedule', v)}
                    options={SCHEDULE_OPTIONS}
                  />
                </FormField>

                {form.survey.trashSchedule && form.survey.trashSchedule !== '19-21' && (
                  <FormField label="¿Por qué no la saca de 19 a 21?" id="noEveningReason">
                    <textarea
                      id="noEveningReason"
                      rows={2}
                      value={form.survey.noEveningReason}
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
                      value={form.survey.bagsCount}
                      onChange={(e) => setSurvey('bagsCount', e.target.value)}
                    />
                  </FormField>
                )}

                <FormField label="¿Cómo descarta residuos voluminosos?">
                  <RadioGroup
                    name="voluminous"
                    columns={1}
                    value={form.survey.voluminousDisposal}
                    onChange={(v) => setSurvey('voluminousDisposal', v)}
                    options={VOLUMINOUS_OPTIONS}
                  />
                </FormField>
                {form.survey.voluminousDisposal === 'otro' && (
                  <FormField label="Especificar" id="volOther">
                    <input
                      id="volOther"
                      value={form.survey.voluminousDisposalOther}
                      onChange={(e) => setSurvey('voluminousDisposalOther', e.target.value)}
                    />
                  </FormField>
                )}
              </SectionCard>

              <SectionCard title="Reciclado" noDivider>
                <FormField label="¿Separa residuos?">
                  <RadioGroup
                    name="separates"
                    value={form.survey.separatesWaste}
                    onChange={(v) => setSurvey('separatesWaste', v)}
                    options={SEPARATES_OPTIONS}
                    columns={1}
                  />
                </FormField>

                <FormField label="¿Dónde dispone los reciclables?">
                  <RadioGroup
                    name="recycle"
                    columns={1}
                    value={form.survey.recyclingPlace}
                    onChange={(v) => setSurvey('recyclingPlace', v)}
                    options={RECYCLE_OPTIONS}
                  />
                </FormField>
                {form.survey.recyclingPlace === 'otro' && (
                  <FormField label="Especificar" id="recOther">
                    <input
                      id="recOther"
                      value={form.survey.recyclingPlaceOther}
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
                    value={form.survey.blockHygiene}
                    onChange={(v) => setSurvey('blockHygiene', v)}
                    options={BLOCK_HYGIENE_OPTIONS}
                  />
                </FormField>

                <FormField label="¿Suele haber residuos diseminados junto al contenedor?">
                  <RadioGroup
                    name="scattered"
                    columns={1}
                    value={form.survey.scatteredTrash}
                    onChange={(v) => setSurvey('scatteredTrash', v)}
                    options={SCATTERED_OPTIONS}
                  />
                </FormField>

                <FormField label="¿Detectaste conductas a corregir en la cuadra?">
                  <RadioGroup
                    name="badBehavior"
                    value={form.survey.hasBadBehavior}
                    onChange={(v) => setSurvey('hasBadBehavior', v)}
                    options={[
                      { value: 'si', label: 'Sí' },
                      { value: 'no', label: 'No' },
                    ]}
                  />
                </FormField>

                {form.survey.hasBadBehavior === 'si' && (
                  <FormField label="Describir la conducta a corregir" id="badBehaviorDesc">
                    <textarea
                      id="badBehaviorDesc"
                      rows={3}
                      value={form.survey.badBehaviorDescription}
                      onChange={(e) => setSurvey('badBehaviorDescription', e.target.value)}
                      required
                    />
                  </FormField>
                )}
              </SectionCard>
            </>
          )}

          {/* Estado general */}
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
          {saving ? 'Guardando...' : 'Guardar recorrido'}
        </PrimaryButton>
        <SecondaryButton type="button" block onClick={() => navigate(-1)}>
          Cancelar
        </SecondaryButton>
      </div>
    </>
  );
}
