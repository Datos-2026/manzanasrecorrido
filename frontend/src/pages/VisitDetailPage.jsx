import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { visitsApi } from '../api/visitsApi';
import { formatDate } from '../utils/dates';
import { exportVisitToPdf } from '../utils/pdfExport';
import MobileHeader from '../components/layout/MobileHeader';
import PageContainer from '../components/ui/PageContainer';
import SectionCard from '../components/ui/SectionCard';
import StatusChip from '../components/ui/StatusChip';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import SecondaryButton from '../components/ui/SecondaryButton';

const SURVEY_LABELS_INITIAL = {
  frontType: 'Tipo de frente',
  buildingUnits: 'Cantidad de departamentos',
  hasSidewalkContainer: 'Contenedor en vereda',
  spokeWith: 'Habló con',
  contactInfo: 'Contacto del vecino',
  trashSchedule: 'Horario de basura',
  noEveningReason: 'Motivo de no sacar 19-21',
  bagsCount: 'Cantidad de bolsas',
  voluminousDisposal: 'Descarte de voluminosos',
  separatesWaste: 'Separa residuos',
  recyclingPlace: 'Dispone reciclables en',
  blockHygiene: 'Higiene de la cuadra',
  scatteredTrash: 'Residuos diseminados',
  hasBadBehavior: 'Conductas a corregir',
  badBehaviorDescription: 'Descripción conducta',
};

const SURVEY_LABELS_FOLLOWUP = {
  spokeWith: 'Habló con',
  hygieneTrend: 'Higiene vs. visita anterior',
  hygieneTrendOther: 'Detalle',
  scatteredAroundContainer: 'Residuos diseminados estos días',
  scatteredSchedule: 'Horario observado',
  bulkyOrRubble: 'Voluminosos/poda/escombros junto al contenedor',
  flyerPosted: '¿Pegó el flyer?',
  flyerFeedback: 'Repercusión del flyer',
  behaviorsToCorrect: 'Conductas a corregir',
  containerState: 'Estado del contenedor',
  containerStateOther: 'Detalle contenedor',
  hasIncidents: '¿Detectó incidencias?',
  incidentsDescription: 'Incidencias',
  observations: 'Observaciones',
};

const SURVEY_VALUE_LABELS = {
  si: 'Sí',
  no: 'No',
  a_veces: 'A veces',
  vecino: 'Vecino/a',
  encargado: 'Encargado',
  comerciante: 'Comerciante',
  no_atendio: 'No atendió',
  no_quiere: 'No quiere ser contactado',
  '10-15': '10 a 15 h',
  '15-19': '15 a 19 h',
  '19-21': '19 a 21 h',
  '21-10': '21 a 10 h',
  boti: 'BOTI',
  147: '147',
  contenedor: 'Junto al contenedor',
  otro: 'Otro',
  verde: 'Contenedor verde',
  punto_verde: 'Punto verde',
  recuperador: 'Recuperador urbano',
  cestos: 'Cestos del edificio',
  no_separa: 'No separa',
  muy_buena: 'Muy buena',
  buena: 'Buena',
  regular: 'Regular',
  mala: 'Mala',
  muy_mala: 'Muy mala',
  todos_los_dias: 'Todos los días',
  nunca: 'Nunca',
  mejoro: 'Mejoró',
  igual: 'Igual',
  empeoro: 'Empeoró',
  limpio: 'Limpio y en orden',
  residuos_alrededor: 'Con residuos alrededor',
  desbordado: 'Desbordado',
  desperfectos: 'Con desperfectos',
  no_aplica: 'No aplica',
};

function SurveyDetails({ data }) {
  const labels =
    data?.kind === 'seguimiento' ? SURVEY_LABELS_FOLLOWUP : SURVEY_LABELS_INITIAL;

  const rows = Object.entries(labels)
    .map(([key, label]) => {
      const raw = data[key];
      if (raw === undefined || raw === null || raw === '') return null;
      const value = SURVEY_VALUE_LABELS[raw] || raw;
      return { key, label, value };
    })
    .filter(Boolean);

  if (!rows.length) {
    return <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Sin datos.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {rows.map((r) => (
        <li
          key={r.key}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            padding: '6px 0',
            borderBottom: '1px solid var(--border-soft)',
            fontSize: 14,
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
          <strong style={{ textAlign: 'right' }}>{r.value}</strong>
        </li>
      ))}
    </ul>
  );
}

export default function VisitDetailPage() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    visitsApi
      .get(id)
      .then(setVisit)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <MobileHeader title="Detalle del recorrido" backTo="/recorridos" />
        <LoadingState />
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileHeader title="Detalle del recorrido" backTo="/recorridos" />
        <PageContainer>
          <ErrorState message={error} />
        </PageContainer>
      </>
    );
  }

  if (!visit) return null;

  const h = visit.hygieneObservation;

  const handleExportPdf = () => {
    try {
      exportVisitToPdf(visit);
    } catch (err) {
      setError('No se pudo exportar el PDF: ' + err.message);
    }
  };

  return (
    <>
      <MobileHeader title="Detalle del recorrido" backTo="/recorridos" />
      <PageContainer>
        <div style={{ marginBottom: 12 }}>
          <SecondaryButton block onClick={handleExportPdf}>
            Exportar relevamiento en PDF
          </SecondaryButton>
        </div>
        <SectionCard
          label="Estado"
          title={visit.block?.code}
          action={<StatusChip status={visit.status} />}
          noDivider
        >
          {visit.weekNumber ? (
            <div style={{ marginBottom: 12 }}>
              <span className="context-pill context-pill--accent">
                {visit.weekNumber === 1
                  ? 'Primer relevamiento'
                  : `Relevamiento semana ${visit.weekNumber} de 5`}
              </span>
            </div>
          ) : null}
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            <strong>Fecha:</strong> {formatDate(visit.visitDate)}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 14 }}>
            <strong>Recorredor:</strong> {visit.user?.firstName} {visit.user?.lastName}
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>Pudo recorrer:</strong> {visit.couldVisit ? 'Sí' : 'No'}
          </p>
          {!visit.couldVisit && visit.reasonNotVisited && (
            <p style={{ margin: '8px 0 0', fontSize: 14 }}>
              <strong>Motivo:</strong> {visit.reasonNotVisited}
            </p>
          )}
        </SectionCard>

        <SectionCard title="Datos del recorrido" noDivider>
          {(visit.street || visit.streetNumber) && (
            <p style={{ margin: '0 0 8px', fontSize: 14 }}>
              <strong>Domicilio:</strong> {visit.street} {visit.streetNumber}
              {visit.doorbell ? ` · Timbre ${visit.doorbell}` : ''}
            </p>
          )}
          {(visit.startTime || visit.endTime) && (
            <p style={{ margin: '0 0 8px', fontSize: 14 }}>
              <strong>Horario:</strong> {visit.startTime || '—'} a {visit.endTime || '—'}
            </p>
          )}
          {visit.generalNotes && (
            <p style={{ margin: '0 0 8px', fontSize: 14 }}>
              <strong>Notas:</strong> {visit.generalNotes}
            </p>
          )}
          {(visit.latitude || visit.longitude) && (
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong>Ubicación:</strong> {visit.latitude}, {visit.longitude}
            </p>
          )}
        </SectionCard>

        {visit.surveyData && (
          <SectionCard
            title={
              visit.surveyData.kind === 'seguimiento'
                ? `Relevamiento de seguimiento (semana ${visit.weekNumber || ''})`
                : 'Primer relevamiento'
            }
            noDivider
          >
            <SurveyDetails data={visit.surveyData} />
          </SectionCard>
        )}

        {h?.photos?.length > 0 && (
          <SectionCard title="Fotos capturadas" noDivider>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {h.photos.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer">
                  <img
                    src={src}
                    alt={`Foto ${i + 1}`}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: '1px solid var(--border-soft)',
                    }}
                  />
                </a>
              ))}
            </div>
          </SectionCard>
        )}

        {h && (
          <SectionCard title="Observaciones de higiene" noDivider>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }}>
              <li>Basura bien dispuesta: {h.trashProperlyDisposed ? 'Sí' : 'No'}</li>
              <li>Basura fuera de horario: {h.trashOutOfSchedule ? 'Sí' : 'No'}</li>
              <li>Voluminosos: {h.bulkyWaste ? 'Sí' : 'No'}</li>
              <li>Escombros: {h.rubble ? 'Sí' : 'No'}</li>
              <li>Contenedores desbordados: {h.overflowingContainers ? 'Sí' : 'No'}</li>
              <li>Punto crítico: {h.criticalPoint ? 'Sí' : 'No'}</li>
            </ul>
            {h.criticalPointDescription && (
              <p style={{ marginTop: 12, fontSize: 14 }}>{h.criticalPointDescription}</p>
            )}
            {h.notes && (
              <p style={{ marginTop: 8, fontSize: 14 }}>
                <strong>Notas:</strong> {h.notes}
              </p>
            )}
          </SectionCard>
        )}

        <SectionCard title="Seguimiento" noDivider>
          <ul className="timeline">
            <li className="timeline__item">
              <span className="timeline__dot timeline__dot--muted" />
              <div>
                <strong>Manzana asignada</strong>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
                  {visit.block?.code}
                </p>
              </div>
            </li>
            <li className="timeline__item">
              <span className="timeline__dot" />
              <div>
                <strong>Recorrida</strong>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
                  {formatDate(visit.visitDate)} — {visit.status}
                </p>
              </div>
            </li>
            {h && (
              <li className="timeline__item">
                <span className="timeline__dot" />
                <div>
                  <strong>Observación registrada</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
                    {h.criticalPoint ? 'Incluye punto crítico' : 'Sin puntos críticos'}
                  </p>
                </div>
              </li>
            )}
          </ul>
        </SectionCard>
      </PageContainer>
    </>
  );
}
