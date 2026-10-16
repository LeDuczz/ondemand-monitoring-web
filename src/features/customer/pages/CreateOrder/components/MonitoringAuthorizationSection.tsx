import { useRef, useState } from 'react'

import {
  AUTHORIZATION_DOCUMENT_TYPES,
  MONITORING_RELATIONSHIPS,
  type AuthorizationDocumentType,
  type FormErrors,
  type FormState,
  type MonitoringAuthorizationDocument,
  type UpdateField,
} from '../../../lib/createOrder/types'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_DOCUMENTS = 10
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const relationshipLabels: Record<
  (typeof MONITORING_RELATIONSHIPS)[number],
  string
> = {
  OWNER: 'Chủ sở hữu / Chủ đầu tư',
  AUTHORIZED_PERSON: 'Người được ủy quyền',
  CONTRACTOR: 'Nhà thầu / Đơn vị thi công',
  MANAGER_OR_SUPERVISOR: 'Đơn vị quản lý / Tư vấn giám sát',
  OTHER: 'Khác',
}

const documentTypeLabels: Record<AuthorizationDocumentType, string> = {
  OWNERSHIP_PROOF: 'Giấy tờ sở hữu / quyền sử dụng',
  OWNER_CONSENT: 'Văn bản chấp thuận của chủ sở hữu',
  AUTHORIZATION_LETTER: 'Giấy ủy quyền',
  SERVICE_CONTRACT: 'Hợp đồng liên quan',
  ASSIGNMENT_LETTER: 'Văn bản giao nhiệm vụ',
  OTHER: 'Tài liệu khác',
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Không thể đọc tệp.'))
    reader.readAsDataURL(file)
  })
}

function newDocument(): MonitoringAuthorizationDocument {
  return {
    id: crypto.randomUUID(),
    documentType: 'OWNER_CONSENT',
    documentName: '',
    notes: '',
    fileName: '',
    contentType: '',
    sizeBytes: 0,
    dataUrl: '',
  }
}

export function MonitoringAuthorizationSection({
  form,
  errors,
  update,
}: {
  form: FormState
  errors: FormErrors
  update: UpdateField
}) {
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})
  const documents = form.monitoringAuthorizationDocuments

  function patchDocument(
    id: string,
    patch: Partial<MonitoringAuthorizationDocument>,
  ) {
    update(
      'monitoringAuthorizationDocuments',
      documents.map((document) =>
        document.id === id ? { ...document, ...patch } : document,
      ),
    )
  }

  async function selectFile(id: string, file?: File) {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadErrors((current) => ({
        ...current,
        [id]: 'Chỉ hỗ trợ tệp PDF, JPG hoặc PNG.',
      }))
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadErrors((current) => ({
        ...current,
        [id]: 'Tệp vượt quá dung lượng tối đa 5 MB.',
      }))
      return
    }
    try {
      const dataUrl = await readDataUrl(file)
      patchDocument(id, {
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        dataUrl,
        documentName:
          documents.find((item) => item.id === id)?.documentName || file.name,
      })
      setUploadErrors((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
    } catch (cause) {
      setUploadErrors((current) => ({
        ...current,
        [id]: cause instanceof Error ? cause.message : 'Không thể đọc tệp.',
      }))
    }
  }

  return (
    <section className="co-authz" aria-labelledby="co-authz-title">
      <div className="co-authz-head">
        <div>
          <h3 id="co-authz-title">Quyền giám sát khu vực</h3>
          <p>
            Xác nhận bạn có quyền yêu cầu giám sát tại khu vực đã chọn. ODMS có
            thể yêu cầu tài liệu chứng minh trước khi thực hiện nhiệm vụ.
          </p>
        </div>
      </div>

      <fieldset className="co-authz-fieldset">
        <legend>Quan hệ của bạn với khu vực</legend>
        <div className="co-authz-relationships">
          {MONITORING_RELATIONSHIPS.map((relationship) => (
            <label key={relationship}>
              <input
                type="radio"
                name="monitoring-relationship"
                checked={form.monitoringRelationship === relationship}
                onChange={() => update('monitoringRelationship', relationship)}
              />
              <span>{relationshipLabels[relationship]}</span>
            </label>
          ))}
        </div>
        {errors.monitoringRelationship ? (
          <div className="ui-field-error">{errors.monitoringRelationship}</div>
        ) : null}
      </fieldset>

      <div className="co-authz-docs-head">
        <div>
          <strong>Tài liệu xác nhận quyền giám sát</strong>
          <span>Không bắt buộc. Có thể thêm nhiều tài liệu.</span>
        </div>
        <button
          type="button"
          className="odm-btn odm-btn-sm"
          disabled={documents.length >= MAX_DOCUMENTS}
          onClick={() =>
            update('monitoringAuthorizationDocuments', [
              ...documents,
              newDocument(),
            ])
          }
        >
          + Thêm tài liệu
        </button>
      </div>

      {documents.length > 0 ? (
        <div className="co-authz-documents">
          {documents.map((document, index) => (
            <div className="co-authz-document" key={document.id}>
              <div className="co-authz-document-title">
                <strong>Tài liệu {index + 1}</strong>
                <button
                  type="button"
                  onClick={() =>
                    update(
                      'monitoringAuthorizationDocuments',
                      documents.filter((item) => item.id !== document.id),
                    )
                  }
                >
                  Xóa
                </button>
              </div>
              <div className="co-authz-document-grid">
                <label>
                  <span>Loại tài liệu</span>
                  <select
                    className="co-input"
                    value={document.documentType}
                    onChange={(event) =>
                      patchDocument(document.id, {
                        documentType: event.target
                          .value as AuthorizationDocumentType,
                      })
                    }
                  >
                    {AUTHORIZATION_DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {documentTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Tên tài liệu</span>
                  <input
                    className="co-input"
                    value={document.documentName}
                    maxLength={160}
                    onChange={(event) =>
                      patchDocument(document.id, {
                        documentName: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                <span>Ghi chú <small>(không bắt buộc)</small></span>
                <input
                  className="co-input"
                  value={document.notes}
                  maxLength={500}
                  onChange={(event) =>
                    patchDocument(document.id, { notes: event.target.value })
                  }
                />
              </label>
              <input
                aria-label={`Tệp tài liệu ${index + 1}`}
                ref={(node) => {
                  fileInputs.current[document.id] = node
                }}
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  void selectFile(document.id, event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <div className="co-authz-file">
                <span>{document.fileName || 'Chưa chọn tệp'}</span>
                <button
                  type="button"
                  onClick={() => fileInputs.current[document.id]?.click()}
                >
                  {document.fileName ? 'Thay thế' : 'Chọn tệp'}
                </button>
              </div>
              {uploadErrors[document.id] ? (
                <div className="ui-field-error">
                  {uploadErrors[document.id]}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {errors.monitoringAuthorizationDocuments ? (
        <div className="ui-field-error">
          {errors.monitoringAuthorizationDocuments}
        </div>
      ) : null}

      <label className="co-authz-confirm">
        <input
          type="checkbox"
          checked={form.monitoringAuthorizationConfirmed}
          onChange={(event) =>
            update('monitoringAuthorizationConfirmed', event.target.checked)
          }
        />
        <span>
          Tôi xác nhận mình có quyền yêu cầu giám sát tại khu vực đã chọn và
          chịu trách nhiệm về tính chính xác của thông tin đã cung cấp.
        </span>
      </label>
      {errors.monitoringAuthorizationConfirmed ? (
        <div className="ui-field-error">
          {errors.monitoringAuthorizationConfirmed}
        </div>
      ) : null}
      <p className="co-authz-note">
        Xác nhận này là khai báo của khách hàng và chưa phải kết quả xác minh của
        Manager.
      </p>
    </section>
  )
}
